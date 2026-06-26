"use client";

import { useEffect, useRef, useState } from "react";

/* Qibla compass. Uses the device's location to compute the great-circle bearing
   to the Kaaba, and the device's compass heading to point a live needle. Turn
   until the needle points straight up — you're facing the Qibla. Degrees + a
   distance-to-Makkah readout work even when the compass isn't available. */

const KAABA = { lat: 21.4225, lng: 39.8262 };
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function bearingTo(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceKm(lat: number, lng: number): number {
  const R = 6371;
  const dφ = toRad(KAABA.lat - lat);
  const dλ = toRad(KAABA.lng - lng);
  const a =
    Math.sin(dφ / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type Status = "idle" | "locating" | "ready" | "denied" | "error";

export default function QiblaCompass() {
  const [status, setStatus] = useState<Status>("idle");
  const [qibla, setQibla] = useState<number | null>(null);
  const [dist, setDist] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  function onOrientation(e: DeviceOrientationEvent) {
    const webkit = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof webkit === "number") {
      setHeading(webkit);
    } else if (e.absolute && e.alpha != null) {
      setHeading((360 - e.alpha) % 360);
    } else if (e.alpha != null) {
      setHeading((360 - e.alpha) % 360);
    }
  }

  async function start() {
    setStatus("locating");
    // 1) Location → Qibla bearing.
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setQibla(bearingTo(latitude, longitude));
        setDist(distanceKm(latitude, longitude));
        setStatus("ready");

        // 2) Compass heading (iOS needs explicit permission on a user gesture).
        try {
          const DOE = window.DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<"granted" | "denied">;
          };
          if (DOE && typeof DOE.requestPermission === "function") {
            const res = await DOE.requestPermission();
            if (res !== "granted") return;
          }
          const handler = (e: DeviceOrientationEvent) => onOrientation(e);
          window.addEventListener("deviceorientationabsolute", handler as EventListener);
          window.addEventListener("deviceorientation", handler as EventListener);
          cleanupRef.current = () => {
            window.removeEventListener("deviceorientationabsolute", handler as EventListener);
            window.removeEventListener("deviceorientation", handler as EventListener);
          };
        } catch {
          /* compass unavailable — degrees readout still works */
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Needle rotation: where the Qibla is relative to where the phone points.
  const needle = qibla != null && heading != null ? (qibla - heading + 360) % 360 : qibla ?? 0;
  const aligned =
    qibla != null && heading != null && Math.min(needle, 360 - needle) < 8;

  return (
    <div className="qibla">
      {status === "idle" && (
        <button type="button" className="btn btn-gold" onClick={start}>
          Find the Qibla
        </button>
      )}
      {status === "locating" && <p className="qibla__hint">Getting your location…</p>}
      {status === "denied" && (
        <p className="qibla__hint">
          Location access is needed to find the Qibla. Please allow location and try again.
        </p>
      )}
      {status === "error" && <p className="qibla__hint">This device can’t provide a location.</p>}

      {status === "ready" && qibla != null && (
        <>
          <div className={`qibla__dial${aligned ? " is-aligned" : ""}`}>
            <div className="qibla__rose" style={{ transform: `rotate(${heading != null ? -heading : 0}deg)` }}>
              <span className="qibla__card n">N</span>
              <span className="qibla__card e">E</span>
              <span className="qibla__card s">S</span>
              <span className="qibla__card w">W</span>
            </div>
            <div className="qibla__needle" style={{ transform: `rotate(${needle}deg)` }}>
              <svg viewBox="0 0 40 120" width="40" height="120" aria-hidden>
                <polygon points="20,6 30,46 20,38 10,46" fill="#c9a227" />
                <rect x="17.5" y="40" width="5" height="66" rx="2.5" fill="rgba(255,255,255,0.5)" />
              </svg>
              <span className="qibla__kaaba" aria-hidden>🕋</span>
            </div>
            <span className="qibla__facing" aria-hidden />
          </div>
          <p className={`qibla__status${aligned ? " is-aligned" : ""}`}>
            {heading == null
              ? "Compass unavailable — face " + Math.round(qibla) + "° from North"
              : aligned
                ? "✓ You’re facing the Qibla"
                : "Turn until the arrow points up"}
          </p>
          <p className="qibla__meta">
            Qibla bearing <b>{Math.round(qibla)}°</b>
            {dist != null && (
              <>
                {" · "}
                {dist.toLocaleString()} km to Makkah
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
