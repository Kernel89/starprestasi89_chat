import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");

function cleanAll() {
  console.log("Starting cleanup of duplicate data in local JSON files...");
  
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at ${dataDir}`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  console.log(`Found ${files.length} JSON data files.`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      let data = JSON.parse(fileContent);
      
      if (Array.isArray(data)) {
        const initialCount = data.length;
        const seen = new Set();
        const cleanedData = data.filter(item => {
          if (item && item.id) {
            if (seen.has(item.id)) {
              return false; // Duplicate
            }
            seen.add(item.id);
            return true;
          }
          return true; // Keep items without ID
        });
        
        const removedCount = initialCount - cleanedData.length;
        
        if (removedCount > 0) {
          fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), "utf-8");
          console.log(`✅ ${file}: Removed ${removedCount} duplicate(s). (Remaining: ${cleanedData.length})`);
        } else {
          console.log(`ℹ️ ${file}: No duplicates found.`);
        }
      }
    } catch (err: any) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }
  
  console.log("Cleanup finished!");
}

cleanAll();
