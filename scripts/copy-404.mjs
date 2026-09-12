import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html written");
