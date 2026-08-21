import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Azerbaijan GitHub Community",
    short_name: "AzGit",
    description:
      "Push the future of Azerbaijan. National open source & innovation growth program aiming for 500,000 GitHub pushes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
