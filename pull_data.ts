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

async function pullAll() {
  console.log("Starting full data pull from Cloudflare D1 to local JSON files...");
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const table of TABLES) {
    try {
      console.log(`Pulling ${table}...`);
      
      const response = await fetch(`${sourceUrlBase}?table=${table}`);

      if (response.ok) {
        const data = await response.json();
        const filePath = path.join(dataDir, `${table}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`✅ ${table} successfully pulled and saved. (${Array.isArray(data) ? data.length : 1} items)`);
      } else {
        const errText = await response.text();
        console.error(`❌ Failed to pull ${table}: [${response.status}] ${errText}`);
      }
    } catch (err: any) {
      console.error(`❌ Error processing ${table}:`, err.message);
    }
  }
  
  console.log("Data pull finished!");
}

pullAll();
