import fs from 'fs';
const data = [
  {
    "code": "13551001",
    "name": "KESEHATAN MASYARAKAT",
    "jenjang": "Sarjana",
    "quota": 82,
    "peminat": 1431
  },
  {
    "code": "13551002",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 1213
  },
  {
    "code": "13551003",
    "name": "KEPERAWATAN",
    "jenjang": "Sarjana",
    "quota": 55,
    "peminat": 1694
  },
  {
    "code": "13551004",
    "name": "GIZI",
    "jenjang": "Sarjana",
    "quota": 35,
    "peminat": 875
  },
  {
    "code": "13551005",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 66,
    "peminat": 488
  },
  {
    "code": "13551006",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 63,
    "peminat": 497
  },
  {
    "code": "13551007",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 63,
    "peminat": 515
  },
  {
    "code": "13551008",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 63,
    "peminat": 286
  },
  {
    "code": "13551009",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 593
  },
  {
    "code": "13551010",
    "name": "INFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 1295
  },
  {
    "code": "13551011",
    "name": "MANAJEMEN SUMBERDAYA PERAIRAN",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 221
  },
  {
    "code": "13551012",
    "name": "AKUAKULTUR",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 199
  },
  {
    "code": "13551013",
    "name": "PERIKANAN TANGKAP",
    "jenjang": "Sarjana",
    "quota": 35,
    "peminat": 143
  },
  {
    "code": "13551014",
    "name": "ILMU KELAUTAN",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 256
  },
  {
    "code": "13551015",
    "name": "OCEANOGRAFI",
    "jenjang": "Sarjana",
    "quota": 46,
    "peminat": 211
  },
  {
    "code": "13551016",
    "name": "TEKNOLOGI HASIL PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 191
  },
  {
    "code": "13551017",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 999
  },
  {
    "code": "13551018",
    "name": "ARSITEKTUR",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 651
  },
  {
    "code": "13551019",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 46,
    "peminat": 854
  },
  {
    "code": "13551020",
    "name": "TEKNIK KIMIA",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 736
  },
  {
    "code": "13551021",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 46,
    "peminat": 704
  },
  {
    "code": "13551022",
    "name": "PERENCANAAN WILAYAH DAN KOTA",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 621
  },
  {
    "code": "13551023",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 1211
  },
  {
    "code": "13551024",
    "name": "TEKNIK LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 768
  },
  {
    "code": "13551025",
    "name": "TEKNIK PERKAPALAN",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 376
  },
  {
    "code": "13551026",
    "name": "TEKNIK GEOLOGI",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 771
  },
  {
    "code": "13551027",
    "name": "TEKNIK GEODESI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 476
  },
  {
    "code": "13551028",
    "name": "TEKNIK KOMPUTER",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 780
  },
  {
    "code": "13551029",
    "name": "PETERNAKAN",
    "jenjang": "Sarjana",
    "quota": 70,
    "peminat": 536
  },
  {
    "code": "13551030",
    "name": "TEKNOLOGI PANGAN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 967
  },
  {
    "code": "13551031",
    "name": "AGROEKOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 553
  },
  {
    "code": "13551032",
    "name": "AGRIBISNIS",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 581
  },
  {
    "code": "13551033",
    "name": "KEDOKTERAN GIGI",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 612
  },
  {
    "code": "13551034",
    "name": "FARMASI",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 904
  },
  {
    "code": "13551035",
    "name": "BIOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 502
  },
  {
    "code": "13551036",
    "name": "SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 394
  },
  {
    "code": "13551037",
    "name": "SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 43,
    "peminat": 692
  },
  {
    "code": "13551038",
    "name": "SEJARAH",
    "jenjang": "Sarjana",
    "quota": 35,
    "peminat": 260
  },
  {
    "code": "13551039",
    "name": "ILMU PERPUSTAKAAN",
    "jenjang": "Sarjana",
    "quota": 39,
    "peminat": 376
  },
  {
    "code": "13551040",
    "name": "HUKUM",
    "jenjang": "Sarjana",
    "quota": 184,
    "peminat": 1958
  },
  {
    "code": "13551041",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 78,
    "peminat": 1524
  },
  {
    "code": "13551042",
    "name": "EKONOMI",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 770
  },
  {
    "code": "13551043",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 78,
    "peminat": 1596
  },
  {
    "code": "13551044",
    "name": "ADMINISTRASI PUBLIK",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 778
  },
  {
    "code": "13551045",
    "name": "ADMINISTRASI BISNIS",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 1308
  },
  {
    "code": "13551046",
    "name": "ILMU PEMERINTAHAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 559
  },
  {
    "code": "13551047",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 1160
  },
  {
    "code": "13551048",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 80,
    "peminat": 1928
  },
  {
    "code": "13551049",
    "name": "BAHASA DAN KEBUDAYAAN JEPANG",
    "jenjang": "Sarjana",
    "quota": 39,
    "peminat": 395
  },
  {
    "code": "13551050",
    "name": "HUBUNGAN INTERNASIONAL",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 568
  },
  {
    "code": "13551051",
    "name": "ANTROPOLOGI SOSIAL",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 384
  },
  {
    "code": "13551052",
    "name": "EKONOMI ISLAM",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 340
  },
  {
    "code": "13551053",
    "name": "ADMINISTRASI PUBLIK KAMPUS REMBANG",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 216
  },
  {
    "code": "13551086",
    "name": "BISNIS DIGITAL",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 793
  },
  {
    "code": "13551087",
    "name": "KESELAMATAN DAN KESEHATAN KERJA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 1104
  },
  {
    "code": "13551088",
    "name": "AGRIBISNIS KAMPUS BATANG",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 69
  },
  {
    "code": "13551089",
    "name": "TEKNOLOGI DAN BISNIS PERIKANAN DAN KELAUTAN",
    "jenjang": "Sarjana",
    "quota": 15,
    "peminat": 85
  },
  {
    "code": "13551090",
    "name": "TEKNIK INDUSTRI KAMPUS BATANG",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 0
  },
  {
    "code": "13552075",
    "name": "TEKNOLOGI REKAYASA KIMIA INDUSTRI",
    "jenjang": "Sarjana Terapan",
    "quota": 26,
    "peminat": 373
  },
  {
    "code": "13552076",
    "name": "TEKNOLOGI REKAYASA OTOMASI",
    "jenjang": "Sarjana Terapan",
    "quota": 26,
    "peminat": 244
  },
  {
    "code": "13552077",
    "name": "REKAYASA PERANCANGAN MEKANIK",
    "jenjang": "Sarjana Terapan",
    "quota": 26,
    "peminat": 200
  },
  {
    "code": "13552078",
    "name": "TEKNOLOGI REKAYASA KONSTRUKSI PERKAPALAN",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 144
  },
  {
    "code": "13552079",
    "name": "TEKNIK LISTRIK INDUSTRI",
    "jenjang": "Sarjana Terapan",
    "quota": 26,
    "peminat": 229
  },
  {
    "code": "13552080",
    "name": "PERENCANAAN TATA RUANG DAN PERTANAHAN",
    "jenjang": "Sarjana Terapan",
    "quota": 30,
    "peminat": 320
  },
  {
    "code": "13552081",
    "name": "TEKNIK INFRASTRUKTUR SIPIL DAN PERANCANGAN ARSITEKTUR",
    "jenjang": "Sarjana Terapan",
    "quota": 42,
    "peminat": 569
  },
  {
    "code": "13552082",
    "name": "AKUNTANSI PERPAJAKAN",
    "jenjang": "Sarjana Terapan",
    "quota": 86,
    "peminat": 845
  },
  {
    "code": "13552083",
    "name": "MANAJEMEN DAN ADMINISTRASI LOGISTIK",
    "jenjang": "Sarjana Terapan",
    "quota": 46,
    "peminat": 614
  },
  {
    "code": "13552084",
    "name": "BAHASA ASING TERAPAN",
    "jenjang": "Sarjana Terapan",
    "quota": 30,
    "peminat": 282
  },
  {
    "code": "13552085",
    "name": "INFORMASI DAN HUMAS",
    "jenjang": "Sarjana Terapan",
    "quota": 46,
    "peminat": 424
  }
];

const code = data.map((item, index) => {
  const jenjang = item.jenjang === 'Sarjana' ? 'S1' : 'D4';
  const id = `prodi-undip-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS DIPONEGORO (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/undip_code.txt', code);
console.log('Done!');
