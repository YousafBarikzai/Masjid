/* Kingston Mosque app design system — a premium dark-emerald look matching the
   website, PWA and mosque screens: deep green surfaces, warm gold accents,
   cream type. Every screen pulls from these tokens only. */

export const colors = {
  // surfaces (dark emerald, layered)
  bg: "#081f15",
  bgRaised: "#0c2c1e",
  surface: "#0e3d29",
  surface2: "#134631",
  glass: "rgba(255,255,255,0.055)",
  glassBorder: "rgba(230,200,121,0.22)",
  line: "rgba(244,239,226,0.10)",

  // brand
  green: "#0e3d29",
  green2: "#16492f",
  mint: "#3ecf8e",
  gold: "#c9a227",
  goldSoft: "#e8d59a",
  goldHot: "#f3dd8f",

  // type
  text: "#f4efe2",
  textDim: "rgba(244,239,226,0.72)",
  textFaint: "rgba(244,239,226,0.5)",
  onGold: "#0c3322",

  // status
  danger: "#e0533d",
  ok: "#2ea05a",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const type = {
  hero: 34,
  h1: 26,
  h2: 20,
  body: 15,
  small: 13,
  tiny: 11,
};

/** Aurora gradient stops used by headers & hero cards. */
export const aurora = ["#16492f", "#0e3d29", "#082b1e"] as const;

export const shadowCard = {
  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};
