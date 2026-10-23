import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f3c766 0%, #e7bd54 55%, #1fb6a6 100%)",
          color: "#0a1411",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "Geist, Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        LS
      </div>
    ),
    { ...size },
  );
}
