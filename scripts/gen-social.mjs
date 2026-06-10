// Generates .github/social-preview.png (1280x640) — Teerth-styled card.
// Run: node scripts/gen-social.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const W = 1280;
const H = 640;
const cyan = "#22d3ee";

const bootLines = [
  "[ ok ] mounting /dev/webcontainer",
  "[ ok ] monaco-editor linked",
  "[ ok ] cross-origin isolation: enabled",
  "[ ready ] node -v  ->  v20.x",
];

// faint binary motif on the right
let bits = "";
for (let r = 0; r < 14; r++) {
  let row = "";
  for (let c = 0; c < 14; c++) row += (r + c) % 3 === 0 ? "1 " : "0 ";
  bits += `<text x="820" y="${70 + r * 38}" font-family="Consolas,'Courier New',monospace" font-size="22" fill="${cyan}" opacity="0.10">${row}</text>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#050505"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="${cyan}" stroke-opacity="0.25" stroke-width="2"/>
  ${bits}
  <text x="72" y="120" font-family="Consolas,'Courier New',monospace" font-size="26" letter-spacing="3" fill="${cyan}">// CODECRAFT</text>
  <text x="68" y="250" font-family="Consolas,'Courier New',monospace" font-size="96" font-weight="bold" fill="#e5e7eb">Codecraft</text>
  <text x="72" y="312" font-family="Consolas,'Courier New',monospace" font-size="30" fill="${cyan}">Backend Engineer · AI Infrastructure · DevOps</text>
  <text x="72" y="372" font-family="Consolas,'Courier New',monospace" font-size="26" fill="#8b8b8b">In-browser IDE · WebContainers running Node.js in the tab</text>
  ${bootLines
    .map(
      (l, i) =>
        `<text x="72" y="${470 + i * 36}" font-family="Consolas,'Courier New',monospace" font-size="24" fill="${
          l.includes("ready") ? cyan : "#6b7280"
        }">${l}</text>`
    )
    .join("")}
</svg>`;

await mkdir(".github", { recursive: true });
const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile(".github/social-preview.png", png);
const meta = await sharp(png).metadata();
console.log(`wrote .github/social-preview.png ${meta.width}x${meta.height} ${png.length} bytes`);
