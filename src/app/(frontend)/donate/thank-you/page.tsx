/* Post-checkout landing shown inside the app's payment sheet (and on the web).
   Stripe redirects here after a completed (or cancelled) donation. The app
   also confirms the outcome natively via /app-api/donate/status. */

export const dynamic = "force-dynamic";

export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;
  const wasCancelled = cancelled === "1";
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          textAlign: "center",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(232,213,154,0.25)",
          borderRadius: 20,
          padding: "42px 30px",
        }}
      >
        <div style={{ fontSize: 52, lineHeight: 1 }}>{wasCancelled ? "🤲" : "💛"}</div>
        <h1 style={{ margin: "18px 0 10px", fontSize: 26, letterSpacing: "-0.02em" }}>
          {wasCancelled ? "No payment was taken" : "JazākAllāhu khayran"}
        </h1>
        <p style={{ opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
          {wasCancelled
            ? "Your donation was cancelled and nothing was charged. Whenever you're ready, we'd be honoured by your support."
            : "Your donation has been received. May Allah accept it from you and make it a ṣadaqah jāriyah in your scale of good deeds."}
        </p>
        <p style={{ opacity: 0.5, fontSize: 13, marginTop: 22 }}>
          You can close this window — a receipt {wasCancelled ? "is only sent for completed donations" : "has been emailed to you by our payment provider"}.
        </p>
      </div>
    </div>
  );
}
