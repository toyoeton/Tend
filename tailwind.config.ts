import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#FAFAF7",
        line: "#D8D6CC",
        muted: "#66665E",
        accent: "#0F766E"
      }
    }
  },
  plugins: []
};

export default config;
