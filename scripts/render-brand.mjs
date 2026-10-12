// Renders PNG brand assets from the SVG sources (needs `sharp`, which Next installs).
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const mark = readFileSync("public/logo-mark.svg");
const logo = readFileSync("public/logo.svg");
mkdirSync("extension/icons", { recursive: true });

await sharp(logo, { density: 192 }).resize(512, 512).png().toFile("public/logo.png");
for (const n of [16, 48, 128]) {
  await sharp(mark, { density: 384 })
    .resize(n, n, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`extension/icons/icon${n}.png`);
}
// Open Graph card: logo on the light brand surface.
const logoPng = await sharp(logo, { density: 192 }).resize(520, 520).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#F3F6FB" } })
  .composite([{ input: logoPng, left: 340, top: 55 }])
  .png()
  .toFile("public/og.png");
console.log("brand assets rendered");
