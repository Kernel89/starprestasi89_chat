const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backupDir = path.join(__dirname, 'backups');

// Buat folder backups jika belum ada
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Cari angka backup terakhir
const files = fs.readdirSync(backupDir);
let maxNum = 0;

for (const file of files) {
  const match = file.match(/^(\d+)\./);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxNum) {
      maxNum = num;
    }
  }
}

// Hitung angka selanjutnya
const nextNum = maxNum + 1;

// Format tanggal YYYY-MM-DD
const date = new Date();
const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

// Nama file zip
const baseName = `${nextNum}. nama yang diperbaiki ${dateStr}.zip`;
const backupPath = path.join(backupDir, baseName);

console.log(`Membuat backup ZIP: ${baseName}...`);

try {
  // Menggunakan tar.exe bawaan Windows untuk zip
  // Pengecualian folder agar file backup tidak menjadi terlalu besar (mengabaikan node_modules, dll)
  const cmd = `tar.exe -a -c -f "backups/${baseName}" --exclude=node_modules --exclude=.git --exclude=dist --exclude=.wrangler --exclude=backups .`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`\nBerhasil membuat backup di folder backups/${baseName}`);
  
  // Proses ke Git/GitHub
  console.log('\nMenambahkan file ZIP ke Git...');
  execSync(`git add "backups/${baseName}"`, { stdio: 'inherit' });
  
  console.log('Melakukan commit ke Git...');
  execSync(`git commit -m "Auto backup: ${baseName}"`, { stdio: 'inherit' });
  
  console.log('Mengunggah (push) ke GitHub...');
  execSync(`git push origin main`, { stdio: 'inherit' });
  
  console.log('\n✅ Proses auto-backup & simpan ke GitHub selesai dengan sukses!');
} catch (error) {
  console.error('\n❌ Terjadi kesalahan saat proses backup:', error.message);
  process.exit(1);
}
