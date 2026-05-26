import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const targetUrlBase = "https://konselingsmandak.info/api/sync";

async function syncAll() {
  console.log("Starting full data deploy from local JSON files to Cloudflare D1...");
  
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at ${dataDir}`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  console.log(`Found ${files.length} JSON data files.`);

  for (const file of files) {
    const tableName = path.basename(file, ".json");
    const filePath = path.join(dataDir, file);
    
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      const count = Array.isArray(data) ? data.length : 1;
      
      console.log(`Syncing ${tableName} (${count} items)...`);
      
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
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }
  
  console.log("Data deployment finished!");
}

syncAll();
