import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lodestar — Networking Intelligence",
    short_name: "Lodestar",
    description: "Turn every event contact into a ranked next action.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#f6f3ec",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/lodestar-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
