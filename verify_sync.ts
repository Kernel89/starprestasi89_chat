import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const sourceUrlBase = "https://konselingsmandak.info/api/sync";

const TABLES = [
  'star_students',
  'star_teachers',
  'star_rombels',
  'star_assignments',
  'star_submissions',
  'star_questionnaireSubmissions',
  'star_attendanceLogs',
  'star_classReports',
  'star_sessions',
  'star_homeVisits',
  'star_advocacies',
  'star_conferences',
  'star_referrals',
  'star_starData',
  'star_sociometrySessions',
  'star_forumPosts',
  'star_quotes',
  'star_materials',
  'star_schedule',
  'star_universities',
  'star_studyPrograms',
  'star_appointments',
  'star_methodSteps',
  'star_counselorProfiles',
  'star_schoolProfile',
  'star_appUsers',
  'star_alumni',
  'star_messages',
  'star_privateCounseling',
  'star_mengenalProdi'
];

async function verifyAll() {
  console.log("Starting verification of data between local files and Cloudflare D1...");
  
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at ${dataDir}`);
    return;
  }

  let matchCount = 0;
  let mismatchCount = 0;
  let failCount = 0;

  for (const table of TABLES) {
    try {
      const filePath = path.join(dataDir, `${table}.json`);
      let localData: any[] = [];
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        localData = JSON.parse(fileContent);
      }

      const response = await fetch(`${sourceUrlBase}?table=${table}`);

      if (response.ok) {
        const cloudData = await response.json();
        
        const localLen = Array.isArray(localData) ? localData.length : 1;
        const cloudLen = Array.isArray(cloudData) ? cloudData.length : 1;

        if (localLen === cloudLen) {
          console.log(`✅ ${table}: Matches! (${localLen} items)`);
          matchCount++;
        } else {
          console.log(`❌ ${table}: Mismatch! Local: ${localLen} items, Cloud: ${cloudLen} items`);
          mismatchCount++;
        }
      } else {
        const errText = await response.text();
        console.error(`⚠️ Failed to fetch ${table} from cloud: [${response.status}] ${errText}`);
        failCount++;
      }
    } catch (err: any) {
      console.error(`⚠️ Error processing ${table}:`, err.message);
      failCount++;
    }
  }
  
  console.log("\nVerification Summary:");
  console.log(`Matched: ${matchCount}`);
  console.log(`Mismatched: ${mismatchCount}`);
  console.log(`Failed to check: ${failCount}`);
}

verifyAll();
