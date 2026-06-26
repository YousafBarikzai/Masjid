import { getPayloadClient } from "@/lib/payloadClient";

/* Diagnostic: while logged into /admin in the same browser, visit /whoami to see
   which account you are and what roles it has — the cause of "You are not allowed
   to perform this action" is almost always a role that lacks the needed permission.
   Also reports how many users / Super Admins exist, to confirm provisioning. */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const p = await getPayloadClient();
    const { user } = await p.auth({ headers: req.headers as unknown as Headers });

    // Overview of accounts (server-side, bypasses access) so we can see the picture.
    let totalUsers = 0;
    let superAdmins: string[] = [];
    try {
      const all = await p.find({ collection: "users", limit: 100, depth: 0, overrideAccess: true });
      totalUsers = all.totalDocs;
      superAdmins = (all.docs as any[])
        .filter((u) => Array.isArray(u.roles) && u.roles.includes("super-admin"))
        .map((u) => u.email);
    } catch {
      /* ignore */
    }

    if (!user) {
      return Response.json(
        {
          loggedIn: false,
          message:
            "Not logged in. Open this URL in the SAME browser where you're logged into /admin.",
          totalUsers,
          superAdmins,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        loggedIn: true,
        email: (user as any).email,
        name: (user as any).name,
        roles: (user as any).roles ?? [],
        isSuperAdmin: Array.isArray((user as any).roles) && (user as any).roles.includes("super-admin"),
        totalUsers,
        superAdmins,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const err = e as { message?: string };
    return Response.json({ error: String(err?.message || e) }, { status: 200 });
  }
}
