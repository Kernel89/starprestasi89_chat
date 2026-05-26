import fs from 'fs';
const data = [
  {
    "code": "13621001",
    "name": "PENDIDIKAN MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 298
  },
  {
    "code": "13621002",
    "name": "PENDIDIKAN FISIKA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 112
  },
  {
    "code": "13621003",
    "name": "PENDIDIKAN KIMIA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 150
  },
  {
    "code": "13621004",
    "name": "PENDIDIKAN BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 222
  },
  {
    "code": "13621005",
    "name": "PENDIDIKAN TEKNIK ELEKTRONIKA",
    "jenjang": "Sarjana",
    "quota": 8,
    "peminat": 38
  },
  {
    "code": "13621006",
    "name": "PENDIDIKAN TEKNIK OTOMOTIF",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 200
  },
  {
    "code": "13621007",
    "name": "PENDIDIKAN TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 157
  },
  {
    "code": "13621008",
    "name": "PENDIDIKAN TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 97
  },
  {
    "code": "13621009",
    "name": "PENDIDIKAN TEKNIK SIPIL & PERENCANAAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 101
  },
  {
    "code": "13621010",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 167
  },
  {
    "code": "13621011",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 102
  },
  {
    "code": "13621012",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 179
  },
  {
    "code": "13621013",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 182
  },
  {
    "code": "13621014",
    "name": "PENDIDIKAN TEKNIK MEKATRONIKA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 68
  },
  {
    "code": "13621015",
    "name": "PENDIDIKAN TEKNIK INFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 17,
    "peminat": 385
  },
  {
    "code": "13621016",
    "name": "PENDIDIKAN IPA",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 169
  },
  {
    "code": "13621017",
    "name": "ILMU KEOLAHRAGAAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 176
  },
  {
    "code": "13621018",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 237
  },
  {
    "code": "13621019",
    "name": "PENDIDIKAN JASMANI KESEHATAN DAN REKREASI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 539
  },
  {
    "code": "13621020",
    "name": "PENDIDIKAN KEPELATIHAN OLAHRAGA",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 351
  },
  {
    "code": "13621021",
    "name": "PENDIDIKAN JASMANI SEKOLAH DASAR",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 188
  },
  {
    "code": "13621022",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 477
  },
  {
    "code": "13621023",
    "name": "TEKNOLOGI INFORMASI",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 615
  },
  {
    "code": "13621024",
    "name": "TEKNIK MANUFAKTUR",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 147
  },
  {
    "code": "13621025",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 675
  },
  {
    "code": "13621026",
    "name": "MANAJEMEN PENDIDIKAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 209
  },
  {
    "code": "13621027",
    "name": "BIMBINGAN & KONSELING",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 573
  },
  {
    "code": "13621028",
    "name": "TEKNOLOGI PENDIDIKAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 127
  },
  {
    "code": "13621029",
    "name": "PENDIDIKAN LUAR BIASA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 154
  },
  {
    "code": "13621030",
    "name": "PENDIDIKAN LUAR SEKOLAH",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 73
  },
  {
    "code": "13621031",
    "name": "PENDIDIKAN KRIYA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 69
  },
  {
    "code": "13621032",
    "name": "PENDIDIKAN KEWARGANEGARAAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 198
  },
  {
    "code": "13621033",
    "name": "PENDIDIKAN SEJARAH",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 205
  },
  {
    "code": "13621034",
    "name": "PENDIDIKAN GEOGRAFI",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 214
  },
  {
    "code": "13621037",
    "name": "PENDIDIKAN TEKNIK BUSANA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 487
  },
  {
    "code": "13621038",
    "name": "PENDIDIKAN TEKNIK BOGA",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 542
  },
  {
    "code": "13621039",
    "name": "PENDIDIKAN ADMINISTRASI PERKANTORAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 326
  },
  {
    "code": "13621040",
    "name": "PENDIDIKAN AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 226
  },
  {
    "code": "13621041",
    "name": "PENDIDIKAN EKONOMI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 234
  },
  {
    "code": "13621042",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 51,
    "peminat": 1796
  },
  {
    "code": "13621043",
    "name": "ILMU SEJARAH",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 152
  },
  {
    "code": "13621044",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 1230
  },
  {
    "code": "13621045",
    "name": "PENDIDIKAN SOSIOLOGI",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 246
  },
  {
    "code": "13621046",
    "name": "PENDIDIKAN IPS",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 178
  },
  {
    "code": "13621047",
    "name": "ADMINISTRASI PUBLIK",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 943
  },
  {
    "code": "13621048",
    "name": "KEBIJAKAN PENDIDIKAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 131
  },
  {
    "code": "13621049",
    "name": "PENDIDIKAN GURU SEKOLAH DASAR",
    "jenjang": "Sarjana",
    "quota": 51,
    "peminat": 1386
  },
  {
    "code": "13621050",
    "name": "PENDIDIKAN GURU PAUD",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 151
  },
  {
    "code": "13621052",
    "name": "PENDIDIKAN BAHASA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 51,
    "peminat": 621
  },
  {
    "code": "13621053",
    "name": "PENDIDIKAN BAHASA JERMAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 76
  },
  {
    "code": "13621054",
    "name": "PENDIDIKAN BAHASA PRANCIS",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 55
  },
  {
    "code": "13621055",
    "name": "PENDIDIKAN SENI RUPA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 105
  },
  {
    "code": "13621056",
    "name": "SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 242
  },
  {
    "code": "13621057",
    "name": "SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 435
  },
  {
    "code": "13621058",
    "name": "PENDIDIKAN SENI TARI",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 156
  },
  {
    "code": "13621059",
    "name": "PENDIDIKAN SENI MUSIK",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 105
  },
  {
    "code": "13621060",
    "name": "PENDIDIKAN BAHASA DAN SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 47,
    "peminat": 586
  },
  {
    "code": "13621061",
    "name": "PENDIDIKAN BAHASA JAWA",
    "jenjang": "Sarjana",
    "quota": 54,
    "peminat": 227
  },
  {
    "code": "13621062",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 39,
    "peminat": 1065
  },
  {
    "code": "13621063",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 47,
    "peminat": 1350
  },
  {
    "code": "13621075",
    "name": "ARSITEKTUR",
    "jenjang": "Sarjana",
    "quota": 8,
    "peminat": 232
  },
  {
    "code": "13621090",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 739
  },
  {
    "code": "13621091",
    "name": "PARIWISATA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 826
  },
  {
    "code": "13621092",
    "name": "ILMU POLITIK",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 101
  },
  {
    "code": "13621093",
    "name": "ILMU HUKUM",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 623
  },
  {
    "code": "13621094",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 10,
    "peminat": 562
  },
  {
    "code": "13621095",
    "name": "DESAIN KOMUNIKASI VISUAL",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 144
  },
  {
    "code": "13621096",
    "name": "PENDIDIKAN AGAMA ISLAM",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 0
  },
  {
    "code": "13622076",
    "name": "TATA BUSANA",
    "jenjang": "Sarjana Terapan",
    "quota": 16,
    "peminat": 366
  },
  {
    "code": "13622077",
    "name": "TATA RIAS DAN KECANTIKAN",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 363
  },
  {
    "code": "13622078",
    "name": "TEKNIK ELEKTRONIKA",
    "jenjang": "Sarjana Terapan",
    "quota": 16,
    "peminat": 119
  },
  {
    "code": "13622079",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 321
  },
  {
    "code": "13622080",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana Terapan",
    "quota": 8,
    "peminat": 119
  },
  {
    "code": "13622081",
    "name": "MANAJEMEN PEMASARAN",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 348
  },
  {
    "code": "13622082",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana Terapan",
    "quota": 8,
    "peminat": 278
  },
  {
    "code": "13622083",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana Terapan",
    "quota": 8,
    "peminat": 160
  },
  {
    "code": "13622084",
    "name": "TATA BOGA",
    "jenjang": "Sarjana Terapan",
    "quota": 22,
    "peminat": 837
  },
  {
    "code": "13622085",
    "name": "MESIN OTOMOTIF",
    "jenjang": "Sarjana Terapan",
    "quota": 8,
    "peminat": 145
  },
  {
    "code": "13622086",
    "name": "ADMINISTRASI PERKANTORAN",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 420
  },
  {
    "code": "13622087",
    "name": "PENGOBATAN TRADISIONAL INDONESIA",
    "jenjang": "Sarjana Terapan",
    "quota": 12,
    "peminat": 64
  },
  {
    "code": "13622088",
    "name": "PENGELOLAAN USAHA REKREASI",
    "jenjang": "Sarjana Terapan",
    "quota": 12,
    "peminat": 85
  },
  {
    "code": "13622089",
    "name": "PROMOSI KESEHATAN",
    "jenjang": "Sarjana Terapan",
    "quota": 12,
    "peminat": 143
  }
];

const code = data.map((item, index) => {
  let jenjang = 'S1';
  if (item.jenjang === 'Sarjana Terapan') jenjang = 'D4';
  if (item.jenjang === 'Diploma Tiga') jenjang = 'D3';
  const id = `prodi-uny-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS NEGERI YOGYAKARTA (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/uny_code.txt', code);
console.log('Done!');
