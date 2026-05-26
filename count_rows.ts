import { execSync } from 'child_process';

// 30 Tables catalog in STAR PRESTASI App
const TABLES = [
  { name: 'star_students', category: 'Master' },
  { name: 'star_alumni', category: 'Master' },
  { name: 'star_teachers', category: 'Master' },
  { name: 'star_rombels', category: 'Master' },
  { name: 'star_appUsers', category: 'Master' },
  { name: 'star_sessions', category: 'Bimbingan' },
  { name: 'star_privateCounseling', category: 'Bimbingan' },
  { name: 'star_appointments', category: 'Bimbingan' },
  { name: 'star_homeVisits', category: 'Bimbingan' },
  { name: 'star_advocacies', category: 'Bimbingan' },
  { name: 'star_conferences', category: 'Bimbingan' },
  { name: 'star_referrals', category: 'Bimbingan' },
  { name: 'star_assignments', category: 'Asesmen' },
  { name: 'star_submissions', category: 'Asesmen' },
  { name: 'star_questionnaireSubmissions', category: 'Asesmen' },
  { name: 'star_sociometrySessions', category: 'Asesmen' },
  { name: 'star_feedbacks', category: 'Asesmen' },
  { name: 'star_mengenalProdi', category: 'Karir' },
  { name: 'star_universities', category: 'Karir' },
  { name: 'star_studyPrograms', category: 'Karir' },
  { name: 'star_attendanceLogs', category: 'Sistem' },
  { name: 'star_classReports', category: 'Sistem' },
  { name: 'star_materials', category: 'Sistem' },
  { name: 'star_forumPosts', category: 'Sistem' },
  { name: 'star_messages', category: 'Sistem' },
  { name: 'star_quotes', category: 'Sistem' },
  { name: 'star_methodSteps', category: 'Sistem' },
  { name: 'star_counselorProfiles', category: 'Sistem' },
  { name: 'star_schoolProfile', category: 'Sistem' }
];

const args = process.argv.slice(2);
const isLocal = args.includes('--local') || args.includes('-l');
const envFlag = isLocal ? '--local' : '--remote';

console.log(`\x1b[36m==============================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[35m📊 STAR PRESTASI - AUDIT ROW DATABASE CLOUDFLARE D1 (${isLocal ? 'LOKAL' : 'REMOT/CLOUD'})\x1b[0m`);
console.log(`\x1b[36m==============================================================\x1b[0m`);
console.log(`Menghubungkan ke Cloudflare D1 database... Sila tunggu.\n`);

try {
  // Build a giant UNION ALL SQL string to fetch counts of all tables in one round-trip!
  const unionSql = TABLES.map(t => `SELECT '${t.name}' AS tbl, COUNT(*) AS cnt FROM ${t.name}`).join(' UNION ALL ');
  const command = `npx wrangler d1 execute star_prestasi_db ${envFlag} --command "${unionSql}" --json`;
  
  const rawOutput = execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  const resultData = JSON.parse(rawOutput);
  
  // Extract rows from wrangler output
  const rows = resultData[0]?.results || [];
  const countsMap = new Map<string, number>();
  rows.forEach((r: any) => {
    countsMap.set(r.tbl, r.cnt);
  });

  // Header
  console.log(`\x1b[1m%-32s | %-12s | %-8s | %-15s\x1b[0m`, "NAMA TABEL (TABLE NAME)", "KATEGORI", "BARIS", "KEPADATAN");
  console.log(`--------------------------------------------------------------------------------`);

  let grandTotal = 0;
  TABLES.forEach(t => {
    const count = countsMap.get(t.name) || 0;
    grandTotal += count;
  });

  TABLES.forEach(t => {
    const count = countsMap.get(t.name) || 0;
    const percentage = grandTotal > 0 ? (count / grandTotal) * 100 : 0;
    const barLength = Math.round(percentage / 10);
    const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
    
    let color = "\x1b[0m"; // Reset
    if (count > 100) color = "\x1b[31m"; // Red for high count
    else if (count > 10) color = "\x1b[33m"; // Yellow
    else if (count > 0) color = "\x1b[32m"; // Green
    
    console.log(`%-32s | %-12s | ${color}%-8d\x1b[0m | %-15s (${percentage.toFixed(1)}%)`, t.name, t.category, count, bar);
  });

  console.log(`--------------------------------------------------------------------------------`);
  console.log(`\x1b[1m%-32s | %-12s | \x1b[35m%-8d\x1b[0m | %-15s\x1b[0m`, "GRAND TOTAL RECORD D1", "", grandTotal, "");
  console.log(`\x1b[36m==============================================================\x1b[0m\n`);

} catch (error: any) {
  console.error(`\x1b[31m❌ ERROR: Gagal mengambil data baris dari Cloudflare D1.\x1b[0m`);
  console.error(`Keterangan: ${error.message}`);
  console.log(`\n\x1b[33m💡 TIPS:\x1b[0m`);
  console.log(`1. Pastikan Anda sudah login ke Cloudflare menggunakan: \x1b[1mnpx wrangler login\x1b[0m`);
  console.log(`2. Jika ingin memeriksa database lokal, jalankan dengan opsi: \x1b[1mnpx tsx count_rows.ts --local\x1b[0m`);
}
