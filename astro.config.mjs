import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://sbanplateria.com",
  output: "static",
  vite: {
    plugins: [tailwindcss()]
  }
});
