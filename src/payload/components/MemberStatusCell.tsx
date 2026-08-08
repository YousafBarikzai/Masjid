"use client";

/* Coloured status chip in the Members list — the same colour language as the
   dashboard tiles, so staff can scan the table at a glance. */

const TONES: Record<string, { bg: string; fg: string; label: string }> = {
  "pending-review": { bg: "#fdf1de", fg: "#8a5a00", label: "Pending review" },
  "more-info-required": { bg: "#fdf1de", fg: "#8a5a00", label: "More info required" },
  "approved-payment-required": { bg: "#e7eef8", fg: "#1f4d8f", label: "Awaiting payment" },
  "payment-verification": { bg: "#e7eef8", fg: "#1f4d8f", label: "Verifying payment" },
  active: { bg: "#e7f4ec", fg: "#0f6a45", label: "Active" },
  "renewal-due": { bg: "#fdf1de", fg: "#8a5a00", label: "Renewal due" },
  "renewal-pending": { bg: "#e7eef8", fg: "#1f4d8f", label: "Renewal pending" },
  expired: { bg: "#fbe9e7", fg: "#9c2b1f", label: "Expired" },
  rejected: { bg: "#f0efeb", fg: "#6c6557", label: "Rejected" },
};

function Chip({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function MemberStatusCell({ cellData }: { cellData?: string }) {
  const t = TONES[String(cellData)] ?? { bg: "#f0efeb", fg: "#6c6557", label: String(cellData || "—") };
  return <Chip {...t} />;
}

const PAY_TONES: Record<string, { bg: string; fg: string; label: string }> = {
  "not-due": { bg: "#f0efeb", fg: "#6c6557", label: "Not due yet" },
  pending: { bg: "#e7eef8", fg: "#1f4d8f", label: "Payment pending" },
  "part-paid": { bg: "#fdf1de", fg: "#8a5a00", label: "Part paid" },
  paid: { bg: "#e7f4ec", fg: "#0f6a45", label: "Paid in full" },
  overdue: { bg: "#fbe9e7", fg: "#9c2b1f", label: "Overdue" },
  waived: { bg: "#efe9f7", fg: "#5b3a8e", label: "Waived" },
};

export function PaymentStatusCell({ cellData }: { cellData?: string }) {
  const t = PAY_TONES[String(cellData)] ?? { bg: "#f0efeb", fg: "#6c6557", label: String(cellData || "—") };
  return <Chip {...t} />;
}

const VOL_TONES: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "#e7eef8", fg: "#1f4d8f", label: "New" },
  reviewed: { bg: "#efe9f7", fg: "#5b3a8e", label: "Reviewed" },
  approved: { bg: "#e2f0e9", fg: "#156146", label: "Approved" },
  active: { bg: "#e7f4ec", fg: "#0f6a45", label: "Active" },
  "follow-up": { bg: "#fdf1de", fg: "#8a5a00", label: "Follow-up" },
  inactive: { bg: "#f0efeb", fg: "#6c6557", label: "Inactive" },
};

export function VolunteerStatusCell({ cellData }: { cellData?: string }) {
  const t = VOL_TONES[String(cellData)] ?? { bg: "#f0efeb", fg: "#6c6557", label: String(cellData || "—") };
  return <Chip {...t} />;
}
