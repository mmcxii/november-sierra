import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f4f0e8",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      },
    ],
    name: "Seventy Five",
    short_name: "Seventy Five",
    start_url: "/group",
    theme_color: "#5c6b4a",
  };
}
