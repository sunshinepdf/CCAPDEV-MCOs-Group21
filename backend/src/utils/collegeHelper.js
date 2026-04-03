import fs from "fs";
import path from "path";

let degreesCache = null;

export function getCollegeFromMajorCode(code) {
  if (!code) return null;
  if (!degreesCache) {
    try {
      const filePath = path.join(process.cwd(), "public", "degrees.json");
      const rawData = fs.readFileSync(filePath, "utf8");
      const degrees = JSON.parse(rawData);
      degreesCache = {};
      for (const d of degrees) {
        degreesCache[d.code] = d.college;
      }
    } catch (err) {
      console.error("Error loading degrees.json:", err.message);
      degreesCache = {};
    }
  }
  return degreesCache[code] || null;
}
