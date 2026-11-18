import FramePauser from "@/components/FramePauser";
import ThemeDirector from "@/components/ThemeDirector";
import Ask from "@/components/sections/Ask";
import { Hero, Shelf } from "@/components/sections/Frames";
import Hire from "@/components/sections/Hire";
import Engage from "@/components/sections/Engage";

export default function Home() {
  return (
    <main>
      <ThemeDirector />
      <FramePauser />
      <Hero />
      <Shelf />
      <Engage />
      <Ask />
      <Hire />
      <footer data-palette="shelf" className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 pt-6 pb-10 sm:px-10">
        <span className="kicker">specterpoint.online</span>
        <span className="kicker">Opeyemi Shodipo · Lagos · Remote</span>
      </footer>
    </main>
  );
}
