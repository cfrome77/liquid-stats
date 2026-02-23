const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // <-- load .env file

// Paths
const templatePath = path.resolve(
  __dirname,
  "../src/environments/environment.template.ts",
);
const targetPath = path.resolve(
  __dirname,
  "../src/environments/environment.ts",
);

// Read template
let template = fs.readFileSync(templatePath, "utf8");

// Replace placeholders with values from .env
template = template
  .replace(
    "__PRODUCTION__",
    process.env.NODE_ENV === "production" ? "true" : "false",
  )
  .replace("__DATA_URL__", process.env.DATA_URL || "")
  .replace("__UNTAPPD_USERNAME__", process.env.UNTAPPD_USERNAME || "")
  .replace("__GA4_MEASUREMENT_ID__", process.env.GA4_MEASUREMENT_ID || "");

// Write generated file
fs.writeFileSync(targetPath, template);

console.log("✅ Generated environment.ts");
