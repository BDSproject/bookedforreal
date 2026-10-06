import { ImageResponse } from "@vercel/og";

export const alt = "Bookedforreal — Réservation en ligne pour coiffeurs et barbiers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OpenGraph image for the home page, localised per locale. */
export default function Image({ params }: { params: { locale: string } }) {
  const fr = params.locale === "fr";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>Bookedforreal</div>
        <div style={{ fontSize: 34, opacity: 0.92, marginTop: 20 }}>
          {fr
            ? "Réservation en ligne pour coiffeurs et barbiers"
            : "Online booking for hairdressers and barbers"}
        </div>
      </div>
    ),
    { ...size },
  );
}
