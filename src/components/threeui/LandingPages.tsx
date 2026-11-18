"use client";

/* The two landing pages this site uses, copied from the registered
   ThreeUI source (src/shaders/landing-pages/LandingPages.tsx). The
   recipes that bundle imports from ./pageRecipes live in
   ./pageTypography alongside the seam that applies them. */

import {
  BESTSELLERS_TYPOGRAPHY,
  COMPLETE_SHELF_TYPOGRAPHY,
  splitTypographyProps,
  usePageTypography,
  type PageTypographyProps,
} from "./pageTypography";
import { LandingPageFrame, type LandingPageProps } from "./LandingPageFrame";
export { LandingPageFrame, applyBackgroundPresentation } from "./LandingPageFrame";
export type { LandingPageFrameProps, LandingPageProps } from "./LandingPageFrame";

export function CompleteShelfLandingPage(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(COMPLETE_SHELF_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="Working Volumes — Seven Tools for Making" sourceUrl="/landing-pages/complete-shelf-v2.html" />;
}

export function BestsellersBookShowcase(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(BESTSELLERS_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="Field Manuals — Tools for Thought" sourceUrl="/landing-pages/bestsellers-book-showcase.html" />;
}
