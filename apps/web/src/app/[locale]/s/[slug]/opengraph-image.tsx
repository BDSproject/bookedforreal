import { ImageResponse } from "@vercel/og";

import { prisma } from "@bookedforreal/db";

export const alt = "Bookedforreal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamically generated OpenGraph image for a salon mini-site. */
export default async function Image({ params }: { params: { slug: string } }) {
  const salon = await prisma.salon.findUnique({
    where: { slug: params.slug },
    select: { name: true, city: true },
  });

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
          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>{salon?.name ?? "Bookedforreal"}</div>
        {salon?.city ? <div style={{ fontSize: 36, opacity: 0.9, marginTop: 12 }}>{salon.city}</div> : null}
        <div style={{ fontSize: 28, marginTop: 28, opacity: 0.85 }}>Réservez en ligne</div>
      </div>
    ),
    { ...size },
  );
}
