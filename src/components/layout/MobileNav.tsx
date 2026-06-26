import { getSite, getMainMenu } from "@/lib/cms";
import MobileTabBar from "./MobileTabBar";

// Server wrapper: fetches the live menu + contact details and hands them to the
// client tab bar. Rendered once in the frontend layout.
export default async function MobileNav() {
  const [site, menu] = await Promise.all([getSite(), getMainMenu()]);
  return (
    <MobileTabBar
      menu={menu}
      phone={site.phone}
      phoneHref={site.phoneHref}
      email={site.email}
    />
  );
}
