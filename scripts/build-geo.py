"""Build the map and gazetteer from geoBoundaries (CC BY 4.0, GRID3 2022).

Input : geoBoundaries-NGA-ADM1_simplified.geojson, geoBoundaries-NGA-ADM2_simplified.geojson
Output: public/geo/nigeria.json   (drawing: state and LGA outlines as SVG paths)
        src/data/areas.json       (gazetteer: every LGA with state, DisCo, centre, hit polygon)

Usage: python scripts/build-geo.py ADM1.geojson ADM2.geojson
Needs: shapely (dev only; nothing here ships to visitors except the output files).
"""

import json
import math
import re
import sys
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent

# Nigeria's extent, padded slightly. Equirectangular, scaled by cos(mid-latitude)
# so shapes are not stretched. Width 1000 user units.
LON0, LON1, LAT0, LAT1 = 2.55, 14.80, 4.10, 14.00
KX = math.cos(math.radians((LAT0 + LAT1) / 2))
W = 1000.0
SCALE = W / ((LON1 - LON0) * KX)
H = round((LAT1 - LAT0) * SCALE, 1)


def project(lon, lat):
    return ((lon - LON0) * KX * SCALE, (LAT1 - lat) * SCALE)


STATE_NAMES = {"Abuja Federal Capital Territory": "FCT"}

# Distribution company by state (NERC franchise areas). Lagos is split by LGA below.
DISCO_BY_STATE = {
    "FCT": "abuja", "Kogi": "abuja", "Nasarawa": "abuja", "Niger": "abuja",
    "Edo": "benin", "Delta": "benin", "Ondo": "benin", "Ekiti": "benin",
    "Enugu": "enugu", "Anambra": "enugu", "Abia": "enugu", "Imo": "enugu", "Ebonyi": "enugu",
    "Oyo": "ibadan", "Ogun": "ibadan", "Osun": "ibadan", "Kwara": "ibadan",
    "Plateau": "jos", "Bauchi": "jos", "Benue": "jos", "Gombe": "jos",
    "Kaduna": "kaduna", "Kebbi": "kaduna", "Sokoto": "kaduna", "Zamfara": "kaduna",
    "Kano": "kano", "Katsina": "kano", "Jigawa": "kano",
    "Rivers": "portharcourt", "Bayelsa": "portharcourt", "Cross River": "portharcourt", "Akwa Ibom": "portharcourt",
    "Adamawa": "yola", "Taraba": "yola", "Borno": "yola", "Yobe": "yola",
}
LAGOS_IKEJA = {"Agege", "Alimosho", "Ifako/Ijaye", "Ikeja", "Ikorodu", "Kosofe", "Oshodi/Isolo", "Shomolu"}
# every other Lagos LGA is served by Eko


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def ring_path(coords, tol):
    pts = [project(x, y) for x, y in coords]
    out = []
    for x, y in pts:
        p = (round(x, 1), round(y, 1))
        if not out or p != out[-1]:
            out.append(p)
    if len(out) < 3:
        return ""
    return "M" + "L".join(f"{x:g},{y:g}" for x, y in out) + "Z"


def geom_path(geom, tol):
    g = geom.simplify(tol, preserve_topology=True)
    polys = [g] if g.geom_type == "Polygon" else list(getattr(g, "geoms", []))
    parts = []
    for p in polys:
        if p.area * SCALE * SCALE * KX < 0.4:  # drop specks smaller than about half a pixel
            continue
        parts.append(ring_path(p.exterior.coords, tol))
    return "".join(parts)


def hit_rings(geom):
    """Coarse projected rings for point-in-polygon on the server."""
    g = geom.simplify(0.01, preserve_topology=True)
    polys = [g] if g.geom_type == "Polygon" else list(getattr(g, "geoms", []))
    rings = []
    for p in polys:
        r = [[round(c, 1) for c in project(x, y)] for x, y in p.exterior.coords]
        if len(r) >= 4:
            rings.append(r)
    return rings


def main(adm1_path, adm2_path):
    adm1 = json.load(open(adm1_path))
    adm2 = json.load(open(adm2_path))

    states = []
    for f in adm1["features"]:
        name = STATE_NAMES.get(f["properties"]["shapeName"], f["properties"]["shapeName"])
        states.append({"name": name, "geom": shape(f["geometry"])})
    country = unary_union([s["geom"] for s in states])

    areas, drawing_lgas, missing = [], [], []
    for f in adm2["features"]:
        lga = f["properties"]["shapeName"].strip()
        g = shape(f["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        c = g.representative_point()
        state = next((s["name"] for s in states if s["geom"].contains(c)), None)
        if state is None:  # coastal slivers: nearest state
            state = min(states, key=lambda s: s["geom"].distance(c))["name"]
        disco = ("ikeja" if lga in LAGOS_IKEJA else "eko") if state == "Lagos" else DISCO_BY_STATE.get(state)
        if not disco:
            missing.append((lga, state))
        area_id = f"{slug(state)}/{slug(lga)}"
        cx, cy = project(c.x, c.y)
        minx, miny, maxx, maxy = g.bounds
        x0, y1 = project(minx, miny)
        x1, y0 = project(maxx, maxy)
        areas.append({
            "id": area_id, "name": lga.replace("/", "-"), "state": state, "disco": disco,
            "c": [round(cx, 1), round(cy, 1)], "ll": [round(c.y, 4), round(c.x, 4)],
            "box": [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
            "hit": hit_rings(g),
        })
        drawing_lgas.append({"id": area_id, "d": geom_path(g, 0.006)})

    ids = [a["id"] for a in areas]
    dupes = {i for i in ids if ids.count(i) > 1}
    for a, d in zip(areas, drawing_lgas):  # two LGAs share a name within a state: keep both distinct
        if a["id"] in dupes:
            a["id"] = d["id"] = f'{a["id"]}-{a["c"][0]:.0f}'

    drawing = {
        "w": W, "h": H,
        "outline": geom_path(country, 0.004),
        "states": [{"name": s["name"], "d": geom_path(s["geom"], 0.005)} for s in states],
        "lgas": drawing_lgas,
        "credit": "Boundaries: geoBoundaries (CC BY 4.0), GRID3 2022",
    }
    (ROOT / "public/geo").mkdir(parents=True, exist_ok=True)
    (ROOT / "src/data").mkdir(parents=True, exist_ok=True)
    (ROOT / "public/geo/nigeria.json").write_text(json.dumps(drawing, separators=(",", ":")))
    # light list for the browser: names, DisCo and where to zoom, no outlines
    places = [{"id": a["id"], "n": a["name"], "s": a["state"], "d": a["disco"], "c": a["c"], "b": a["box"]} for a in areas]
    (ROOT / "public/geo/places.json").write_text(json.dumps(places, separators=(",", ":")))
    (ROOT / "src/data/areas.json").write_text(json.dumps(
        {"w": W, "h": H, "proj": {"lon0": LON0, "lat1": LAT1, "kx": KX, "scale": SCALE}, "areas": areas},
        separators=(",", ":")))
    print(f"{len(areas)} LGAs, {len(states)} states, viewBox 0 0 {W:g} {H}")
    print("drawing KB", round((ROOT / "public/geo/nigeria.json").stat().st_size / 1024),
          "| gazetteer KB", round((ROOT / "src/data/areas.json").stat().st_size / 1024))
    print("no DisCo:", missing or "none", "| renamed duplicates:", sorted(dupes) or "none")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
