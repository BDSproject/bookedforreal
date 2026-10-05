import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

import { preset } from "../../packages/config/tailwind/preset";

/**
 * Web Tailwind config: extends the shared brand preset and scans both the app
 * and the shared UI package for class names.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [preset],
  plugins: [tailwindcssAnimate],
};

export default config;
