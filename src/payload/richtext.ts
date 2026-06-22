// Shared rich-text configuration used by BOTH the Payload editor (admin) and the
// website renderer, so the colours an editor picks actually show on the public
// site. Payload's default text converter renders bold/italic/etc. but NOT the
// TextState colours — so the frontend renderer (RichTextRenderer) reads these
// same definitions to apply the matching CSS.

// stateKey -> stateValue -> { label shown in the toolbar, css applied }
export const textStates = {
  color: {
    green: { label: "Mosque green", css: { color: "#0f5132" } },
    gold: { label: "Gold", css: { color: "#b8860b" } },
    blue: { label: "Blue", css: { color: "#1f5fae" } },
    red: { label: "Red", css: { color: "#c0392b" } },
    purple: { label: "Purple", css: { color: "#6b3fa0" } },
    grey: { label: "Grey", css: { color: "#6c6557" } },
  },
  highlight: {
    yellow: { label: "Yellow highlight", css: { "background-color": "#fff3bf" } },
    green: { label: "Green highlight", css: { "background-color": "#d3f9d8" } },
    gold: { label: "Gold highlight", css: { "background-color": "#f7ecc9" } },
  },
} as const;

/** Convert a hyphenated CSS object (e.g. { "background-color": … }) to a React
 *  style object (e.g. { backgroundColor: … }). */
export function toReactStyle(css: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(css)) {
    out[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

/** Build a React style object from a serialized text node's state (`node.$`). */
export function styleFromState(state: Record<string, string> | undefined): Record<string, string> {
  if (!state) return {};
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(state)) {
    const group = (textStates as Record<string, Record<string, { css: Record<string, string> }>>)[key];
    const css = group?.[value]?.css;
    if (css) Object.assign(style, toReactStyle(css));
  }
  return style;
}
