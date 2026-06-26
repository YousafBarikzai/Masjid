import { RichText } from "@payloadcms/richtext-lexical/react";
import { styleFromState } from "@/payload/richtext";

// Override the default text converter so TextState colours/highlights chosen in
// the admin are applied on the public site too (the built-in converter only
// handles bold/italic/etc.). All other nodes use Payload's defaults.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const converters = ({ defaultConverters }: { defaultConverters: any }) => ({
  ...defaultConverters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: (args: any) => {
    const base = defaultConverters.text(args);
    const style = styleFromState(args?.node?.$);
    return Object.keys(style).length ? <span style={style}>{base}</span> : base;
  },
});

export default function RichTextRenderer({ data }: { data: unknown }) {
  if (!data) return null;
  return <RichText data={data as never} converters={converters as never} />;
}
