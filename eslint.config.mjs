import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next ships a flat config array (next + next/typescript +
// core-web-vitals). `@typescript-eslint/no-explicit-any` is already off in that
// preset, so no local override is needed.
const eslintConfig = [...nextCoreWebVitals];

export default eslintConfig;
