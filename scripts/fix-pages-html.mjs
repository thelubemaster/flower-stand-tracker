import { readFileSync, writeFileSync } from "node:fs";

const file = "dist/client/index.html";
const html = readFileSync(file, "utf8").replaceAll('"/./', '"./');
if (!html.includes("./assets/")) {
  console.error("pages html is missing relative assets");
  process.exit(1);
}
if (html.includes('"/./')) {
  console.error("pages html still has broken /./ paths");
  process.exit(1);
}
writeFileSync(file, html);
console.log("fixed pages html");
