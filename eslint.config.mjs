import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next ships a flat config array (next + next/typescript +
// core-web-vitals). `@typescript-eslint/no-explicit-any` is already off in that
// preset, so no local override is needed.
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // Fail CI on any source function with 15 or more branches; split it
    // instead. Tests are left out.
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["tests/**"],
    rules: {
      complexity: ["error", { max: 14 }],
    },
  },
];

export default eslintConfig;
