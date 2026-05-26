import fs from "fs";
import path from "path";
import { SNPMB_UNIVERSITIES, SNPMB_PROGRAMS } from "./constants";

const targetFileUnis = path.join(process.cwd(), "data", "star_universities.json");
const targetFileProdis = path.join(process.cwd(), "data", "star_studyPrograms.json");

function run() {
  console.log("Reading SNPMB_UNIVERSITIES from constants.tsx...");
  console.log(`Found ${SNPMB_UNIVERSITIES.length} items.`);
  
  console.log(`Writing to ${targetFileUnis}...`);
  fs.writeFileSync(targetFileUnis, JSON.stringify(SNPMB_UNIVERSITIES, null, 2), "utf-8");
  
  console.log("Reading SNPMB_PROGRAMS from constants.tsx...");
  console.log(`Found ${SNPMB_PROGRAMS.length} items.`);
  
  console.log(`Writing to ${targetFileProdis}...`);
  fs.writeFileSync(targetFileProdis, JSON.stringify(SNPMB_PROGRAMS, null, 2), "utf-8");
  
  console.log("Done!");
}

run();
