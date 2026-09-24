import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

// Bundles the Lit panel into the served, committed asset the integration ships.
// HACS installs the repo as-is, so this output must be committed.
export default {
  input: "src/alexa-panel.ts",
  output: {
    file: "../custom_components/alexa_organizer/frontend/alexa-panel.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
      outDir: "../custom_components/alexa_organizer/frontend",
    }),
    terser({ format: { comments: false } }),
  ],
};
