import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const targetUrlBase = "https://konselingsmandak.info/api/sync";

async function syncTable(tableName: string) {
  const filePath = path.join(dataDir, `${tableName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    console.log(`Syncing ${tableName} (${data.length} items)...`);
    
    const response = await fetch(`${targetUrlBase}?table=${tableName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: fileContent
    });

    if (response.ok) {
      const resData: any = await response.json();
      console.log(`✅ ${tableName} successfully synced:`, resData);
    } else {
      const errText = await response.text();
      console.error(`❌ Failed to sync ${tableName}: [${response.status}] ${errText}`);
    }
  } catch (err: any) {
    console.error(`❌ Error processing file:`, err.message);
  }
}

async function run() {
  console.log("Starting data deploy to Cloudflare D1...");
  await syncTable("star_universities");
  await syncTable("star_studyPrograms");
}

run();
