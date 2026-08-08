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

const NIKAH_TONES: Record<string, { bg: string; fg: string; label: string }> = {
  submitted: { bg: "#e7eef8", fg: "#1f4d8f", label: "Submitted" },
  "under-review": { bg: "#efe9f7", fg: "#5b3a8e", label: "Under review" },
  "info-required": { bg: "#fdf1de", fg: "#8a5a00", label: "Info required" },
  verification: { bg: "#e0f0f5", fg: "#0f5c73", label: "Verification" },
  approved: { bg: "#e7f4ec", fg: "#0f6a45", label: "Approved · live" },
  paused: { bg: "#f0efeb", fg: "#6c6557", label: "Paused" },
  rejected: { bg: "#fbe9e7", fg: "#9c2b1f", label: "Not approved" },
  suspended: { bg: "#fbe9e7", fg: "#9c2b1f", label: "Suspended" },
  withdrawn: { bg: "#f0efeb", fg: "#6c6557", label: "Withdrawn" },
};

export function NikahStatusCell({ cellData }: { cellData?: string }) {
  const t = NIKAH_TONES[String(cellData)] ?? { bg: "#f0efeb", fg: "#6c6557", label: String(cellData || "—") };
  return <Chip {...t} />;
}

const INTRO_TONES: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "#e7eef8", fg: "#1f4d8f", label: "New" },
  "awaiting-wali": { bg: "#fdf1de", fg: "#8a5a00", label: "Awaiting wali" },
  "families-connected": { bg: "#e0f0f5", fg: "#0f5c73", label: "Families connected" },
  meeting: { bg: "#efe9f7", fg: "#5b3a8e", label: "Meeting arranged" },
  considering: { bg: "#f0efeb", fg: "#6c6557", label: "Considering" },
  proceeding: { bg: "#e2f0e9", fg: "#156146", label: "Proceeding" },
  "intro-paused": { bg: "#f0efeb", fg: "#6c6557", label: "Paused" },
  declined: { bg: "#fbe9e7", fg: "#9c2b1f", label: "Not proceeding" },
  engaged: { bg: "#fdf1de", fg: "#8a5a00", label: "Engaged 💍" },
  "nikah-arranged": { bg: "#e7f4ec", fg: "#0f6a45", label: "Nikah arranged" },
  completed: { bg: "#e7f4ec", fg: "#0f6a45", label: "Completed 🤲" },
};

export function IntroStatusCell({ cellData }: { cellData?: string }) {
  const t = INTRO_TONES[String(cellData)] ?? { bg: "#f0efeb", fg: "#6c6557", label: String(cellData || "—") };
  return <Chip {...t} />;
}
