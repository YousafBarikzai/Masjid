import { RichText } from "@payloadcms/richtext-lexical/react";
import { styleFromState } from "@/payload/richtext";
import { BlockView } from "./RenderBlocks";

// Two overrides on top of Payload's default converters:
//  · text — apply the TextState colours/highlights chosen in the admin (the
//    built-in converter only handles bold/italic/etc.)
//  · blocks — render the layout blocks inserted inline in the unified editor
//    (images, galleries, videos, callouts, columns, buttons, downloads,
//    background sections) with the same components the legacy sections use,
//    so old and new content look identical.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockConverter = ({ node }: any) => <BlockView b={{ blockType: node?.fields?.blockType, ...node?.fields }} />;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const converters = ({ defaultConverters }: { defaultConverters: any }) => ({
  ...defaultConverters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: (args: any) => {
    const base = defaultConverters.text(args);
    const style = styleFromState(args?.node?.$);
    return Object.keys(style).length ? <span style={style}>{base}</span> : base;
  },
  blocks: {
    content: blockConverter,
    callout: blockConverter,
    columns: blockConverter,
    mediaBlock: blockConverter,
    gallery: blockConverter,
    videoEmbed: blockConverter,
    cta: blockConverter,
    download: blockConverter,
  },
});

export default function RichTextRenderer({ data }: { data: unknown }) {
  if (!data) return null;
  return <RichText data={data as never} converters={converters as never} />;
}
