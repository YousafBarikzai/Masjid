import Link from "next/link";

export default function CTASection({
  heading,
  body,
  buttonLabel = "Contact the office",
  buttonHref = "/contact",
  secondaryLabel,
  secondaryHref,
}: {
  heading: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="cta-band-text">
          <h2>{heading}</h2>
          {body && <p>{body}</p>}
        </div>
        <div className="cta-band-actions">
          <Link className="btn btn-gold" href={buttonHref}>
            {buttonLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link className="btn btn-outline" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
