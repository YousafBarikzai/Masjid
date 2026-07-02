// A template re-mounts on every navigation (unlike layout), so wrapping the page
// content here gives us a lightweight fade/slide page transition for an app-like
// feel. Pure CSS (see .page-tx in globals.css); respects reduced-motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-tx">{children}</div>;
}
