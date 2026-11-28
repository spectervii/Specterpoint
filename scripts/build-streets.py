"""
Street tiles for the map's closest zoom levels.

Reads OpenStreetMap regional extracts (.osm.pbf from download.openstreetmap.fr,
"africa/nigeria/<region>-latest.osm.pbf") and writes small JSON tiles of the
streets in the cities below, in the same projection as public/geo/nigeria.json:

    public/streets/index.json        tile size, which tiles exist, city boxes
    public/streets/<tx>_<ty>.json    {"M": [major road paths], "m": [minor road paths],
                                      "n": [[name, x, y, angle], ...]}

The map only fetches the tiles in view once it is zoomed in, so the page stays light.
Street data © OpenStreetMap contributors, ODbL.

    python scripts/build-streets.py south_west.osm.pbf north_central.osm.pbf south_south.osm.pbf

Needs: pip install osmium shapely
"""
import json
import math
import os
import shutil
import sys

import osmium
from shapely.geometry import LineString

# same projection as scripts/build-geo.py
LON0, LON1, LAT0, LAT1 = 2.55, 14.80, 4.10, 14.00
KX = math.cos(math.radians((LAT0 + LAT1) / 2))
W = 1000.0
SCALE = W / ((LON1 - LON0) * KX)


def project(lon, lat):
    return ((lon - LON0) * KX * SCALE, (LAT1 - lat) * SCALE)


# (name, south, west, north, east)
CITIES = [
    ("Lagos", 6.36, 2.85, 6.75, 3.80),
    ("Abuja", 8.80, 7.20, 9.25, 7.65),
    ("Port Harcourt", 4.70, 6.85, 4.98, 7.15),
    ("Warri and Effurun", 5.44, 5.65, 5.66, 5.88),
    ("Asaba", 6.12, 6.64, 6.28, 6.80),
]

MAJOR = {"motorway", "trunk", "primary", "secondary", "tertiary",
         "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"}
MINOR = {"residential", "unclassified", "living_street", "road"}

TILE = 1.5          # map units, about 2 km
COARSE = 6.0        # overview tiles (main roads only) for middle zoom levels
COARSE_SIMPLIFY = 0.01
SIMPLIFY = 0.0015   # map units, about 2 m
DP = 3              # decimals kept (about 1.3 m)


def in_city(lat, lon):
    return any(s <= lat <= n and w <= lon <= e for _, s, w, n, e in CITIES)


class Streets(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.ways = []

    def way(self, w):
        hw = w.tags.get("highway")
        if hw not in MAJOR and hw not in MINOR:
            return
        try:
            pts = [(n.lon, n.lat) for n in w.nodes]
        except osmium.InvalidLocationError:
            return
        if len(pts) < 2 or not any(in_city(lat, lon) for lon, lat in pts):
            return
        self.ways.append((hw in MAJOR, w.tags.get("name"), [project(lon, lat) for lon, lat in pts]))


def path(coords):
    out = []
    for i, (x, y) in enumerate(coords):
        out.append(("M" if i == 0 else "L") + f"{round(x, DP):g} {round(y, DP):g}")
    return "".join(out)


def main(files, out_dir):
    h = Streets()
    for f in files:
        print("reading", f, flush=True)
        h.apply_file(f, locations=True, idx="flex_mem")
    print(len(h.ways), "street ways", flush=True)

    tiles = {}
    coarse = {}
    seen_names = {}
    for major, name, pts in h.ways:
        line = LineString(pts).simplify(SIMPLIFY, preserve_topology=False)
        coords = list(line.coords)
        if len(coords) < 2:
            continue
        x0, y0, x1, y1 = line.bounds
        d = path(coords)
        for tx in range(int(x0 // TILE), int(x1 // TILE) + 1):
            for ty in range(int(y0 // TILE), int(y1 // TILE) + 1):
                t = tiles.setdefault((tx, ty), {"M": [], "m": [], "n": []})
                t["M" if major else "m"].append(d)
        if major:
            c = LineString(pts).simplify(COARSE_SIMPLIFY, preserve_topology=False)
            cc = list(c.coords)
            if len(cc) >= 2:
                dc = path([(round(x, 2), round(y, 2)) for x, y in cc])
                cx0, cy0, cx1, cy1 = c.bounds
                for tx in range(int(cx0 // COARSE), int(cx1 // COARSE) + 1):
                    for ty in range(int(cy0 // COARSE), int(cy1 // COARSE) + 1):
                        coarse.setdefault((tx, ty), []).append(dc)
        # one label per street name per tile, at the middle of its longest piece
        if name and line.length > 0.05:
            mid = line.interpolate(0.5, normalized=True)
            a = line.interpolate(0.45, normalized=True)
            b = line.interpolate(0.55, normalized=True)
            ang = math.degrees(math.atan2(b.y - a.y, b.x - a.x))
            if ang > 90:
                ang -= 180
            if ang < -90:
                ang += 180
            key = (int(mid.x // TILE), int(mid.y // TILE), name)
            if key not in seen_names or seen_names[key][0] < line.length:
                seen_names[key] = (line.length, major, [name, round(mid.x, DP), round(mid.y, DP), round(ang)])

    for (tx, ty, _), (_, major, label) in seen_names.items():
        t = tiles.setdefault((tx, ty), {"M": [], "m": [], "n": []})
        t["n"].append(label + [1 if major else 0])

    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)
    total = 0
    for (tx, ty), t in tiles.items():
        body = json.dumps(t, separators=(",", ":"), ensure_ascii=False)
        total += len(body)
        with open(os.path.join(out_dir, f"{tx}_{ty}.json"), "w") as fh:
            fh.write(body)

    os.makedirs(os.path.join(out_dir, "z"))
    for (tx, ty), paths in coarse.items():
        with open(os.path.join(out_dir, "z", f"{tx}_{ty}.json"), "w") as fh:
            fh.write(json.dumps({"M": paths}, separators=(",", ":")))

    boxes = []
    for name, s, w, n, e in CITIES:
        x0, y1 = project(w, s)
        x1, y0 = project(e, n)
        boxes.append({"name": name, "box": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]})
    index = {"tile": TILE, "tiles": sorted(f"{tx}_{ty}" for tx, ty in tiles),
             "coarse": COARSE, "coarseTiles": sorted(f"{tx}_{ty}" for tx, ty in coarse), "cities": boxes,
             "credit": "Streets © OpenStreetMap contributors (ODbL)"}
    with open(os.path.join(out_dir, "index.json"), "w") as fh:
        json.dump(index, fh, separators=(",", ":"))
    print(len(tiles), "tiles,", round(total / 1e6, 1), "MB;", len(coarse), "overview tiles", flush=True)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    main(sys.argv[1:], os.path.join(here, "..", "public", "streets"))
