import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..");
const svgPath = path.join(repo, "assets/icons/typecascade-mark.svg");
const svg = fs.readFileSync(svgPath);

for (const size of [16, 32, 48, 128]) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const out = path.join(repo, `assets/icons/icon-${size}.png`);
  fs.writeFileSync(out, resvg.render().asPng());
  console.log("wrote", out);
}
