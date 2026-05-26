import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "data", "star_studyPrograms.json");

function addPKNSTAN() {
  const content = fs.readFileSync(dataPath, "utf-8");
  const prodi = JSON.parse(content);
  
  // Find highest ID
  let maxId = 0;
  for (const p of prodi) {
    const idNum = parseInt(p.id, 10);
    if (!isNaN(idNum) && idNum > maxId) {
      maxId = idNum;
    }
  }
  
  const newProdis = [
    { nama: "AKUNTANSI SEKTOR PUBLIK", jenjang: "D4", kuota: 300, peminat: 6000 },
    { nama: "MANAJEMEN KEUANGAN NEGARA", jenjang: "D4", kuota: 250, peminat: 5000 },
    { nama: "MANAJEMEN ASET PUBLIK", jenjang: "D4", kuota: 150, peminat: 3000 }
  ];
  
  newProdis.forEach(np => {
    maxId++;
    prodi.push({
      id: maxId.toString(),
      kode_prodi: "STAN" + maxId,
      nama_prodi: np.nama,
      pt_name: "POLITEKNIK KEUANGAN NEGARA STAN (Kedinasan)",
      jenjang: np.jenjang,
      quota: np.kuota,
      peminat: np.peminat
    });
  });
  
  fs.writeFileSync(dataPath, JSON.stringify(prodi, null, 2));
  console.log("Added PKN STAN prodis successfully!");
}

addPKNSTAN();
