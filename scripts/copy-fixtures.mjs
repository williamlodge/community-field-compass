// Copies JSON fixtures next to the compiled server so `npm start` can load them.
import { cpSync } from "node:fs";
cpSync("src/data/fixtures", "dist/data/fixtures", { recursive: true });
