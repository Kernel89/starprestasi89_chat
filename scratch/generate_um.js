import fs from 'fs';
const data = [
  {
    "code": "13731001",
    "name": "PENDIDIKAN MATEMATIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 80,
    "peminat": 471
  },
  {
    "code": "13731002",
    "name": "PENDIDIKAN FISIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 76,
    "peminat": 168
  },
  {
    "code": "13731003",
    "name": "PENDIDIKAN KIMIA",
    "jenjang": "Sarjana",
    "dayaTampung": 71,
    "peminat": 285
  },
  {
    "code": "13731004",
    "name": "PENDIDIKAN BIOLOGI",
    "jenjang": "Sarjana",
    "dayaTampung": 46,
    "peminat": 354
  },
  {
    "code": "13731005",
    "name": "PENDIDIKAN TEKNIK MESIN",
    "jenjang": "Sarjana",
    "dayaTampung": 55,
    "peminat": 126
  },
  {
    "code": "13731006",
    "name": "PENDIDIKAN TEKNIK BANGUNAN",
    "jenjang": "Sarjana",
    "dayaTampung": 48,
    "peminat": 114
  },
  {
    "code": "13731007",
    "name": "PENDIDIKAN TEKNIK INFORMATIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 34,
    "peminat": 259
  },
  {
    "code": "13731008",
    "name": "PENDIDIKAN TEKNIK OTOMOTIF",
    "jenjang": "Sarjana",
    "dayaTampung": 55,
    "peminat": 125
  },
  {
    "code": "13731009",
    "name": "ILMU KEOLAHRAGAAN",
    "jenjang": "Sarjana",
    "dayaTampung": 56,
    "peminat": 205
  },
  {
    "code": "13731010",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 78,
    "peminat": 355
  },
  {
    "code": "13731011",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 76,
    "peminat": 170
  },
  {
    "code": "13731012",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "dayaTampung": 51,
    "peminat": 302
  },
  {
    "code": "13731013",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "dayaTampung": 37,
    "peminat": 325
  },
  {
    "code": "13731014",
    "name": "PENDIDIKAN TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "dayaTampung": 42,
    "peminat": 124
  },
  {
    "code": "13731015",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana",
    "dayaTampung": 44,
    "peminat": 561
  },
  {
    "code": "13731016",
    "name": "PENDIDIKAN ILMU PENGETAHUAN ALAM",
    "jenjang": "Sarjana",
    "dayaTampung": 75,
    "peminat": 378
  },
  {
    "code": "13731017",
    "name": "KESEHATAN MASYARAKAT",
    "jenjang": "Sarjana",
    "dayaTampung": 110,
    "peminat": 1430
  },
  {
    "code": "13731018",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana",
    "dayaTampung": 35,
    "peminat": 462
  },
  {
    "code": "13731019",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "dayaTampung": 38,
    "peminat": 381
  },
  {
    "code": "13731020",
    "name": "TEKNIK INFORMATIKA",
    "jenjang": "Sarjana",
    "dayaTampung": 32,
    "peminat": 983
  },
  {
    "code": "13731021",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "dayaTampung": 35,
    "peminat": 700
  },
  {
    "code": "13731022",
    "name": "BIOTEKNOLOGI",
    "jenjang": "Sarjana",
    "dayaTampung": 24,
    "peminat": 334
  },
  {
    "code": "13731028",
    "name": "BIMBINGAN DAN KONSELING",
    "jenjang": "Sarjana",
    "dayaTampung": 60,
    "peminat": 662
  },
  {
    "code": "13731029",
    "name": "PENDIDIKAN JASMANI, KESEHATAN, DAN REKREASI",
    "jenjang": "Sarjana",
    "dayaTampung": 79,
    "peminat": 505
  },
  {
    "code": "13731030",
    "name": "TEKNOLOGI PENDIDIKAN",
    "jenjang": "Sarjana",
    "dayaTampung": 62,
    "peminat": 287
  },
  {
    "code": "13731031",
    "name": "PENDIDIKAN NONFORMAL",
    "jenjang": "Sarjana",
    "dayaTampung": 76,
    "peminat": 129
  },
  {
    "code": "13731032",
    "name": "MANAJEMEN PENDIDIKAN",
    "jenjang": "Sarjana",
    "dayaTampung": 59,
    "peminat": 348
  },
  {
    "code": "13731033",
    "name": "PENDIDIKAN GURU SEKOLAH DASAR",
    "jenjang": "Sarjana",
    "dayaTampung": 118,
    "peminat": 1490
  },
  {
    "code": "13731034",
    "name": "PENDIDIKAN GURU PEND. ANAK USIA DINI",
    "jenjang": "Sarjana",
    "dayaTampung": 65,
    "peminat": 224
  },
  {
    "code": "13731035",
    "name": "PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN",
    "jenjang": "Sarjana",
    "dayaTampung": 66,
    "peminat": 428
  },
  {
    "code": "13731036",
    "name": "PEND. BAHASA, SASTRA INDONESIA & DAERAH",
    "jenjang": "Sarjana",
    "dayaTampung": 55,
    "peminat": 569
  },
  {
    "code": "13731037",
    "name": "PENDIDIKAN BAHASA INGGRIS",
    "jenjang": "Sarjana",
    "dayaTampung": 46,
    "peminat": 545
  },
  {
    "code": "13731038",
    "name": "PENDIDIKAN BAHASA ARAB",
    "jenjang": "Sarjana",
    "dayaTampung": 72,
    "peminat": 331
  },
  {
    "code": "13731039",
    "name": "PENDIDIKAN SENI RUPA",
    "jenjang": "Sarjana",
    "dayaTampung": 55,
    "peminat": 222
  },
  {
    "code": "13731040",
    "name": "PENDIDIKAN BAHASA JERMAN",
    "jenjang": "Sarjana",
    "dayaTampung": 42,
    "peminat": 124
  },
  {
    "code": "13731041",
    "name": "PENDIDIKAN SENI PERTUNJUKAN",
    "jenjang": "Sarjana",
    "dayaTampung": 58,
    "peminat": 151
  },
  {
    "code": "13731042",
    "name": "PENDIDIKAN SEJARAH",
    "jenjang": "Sarjana",
    "dayaTampung": 72,
    "peminat": 300
  },
  {
    "code": "13731043",
    "name": "PENDIDIKAN EKONOMI",
    "jenjang": "Sarjana",
    "dayaTampung": 45,
    "peminat": 358
  },
  {
    "code": "13731044",
    "name": "PENDIDIKAN BISNIS",
    "jenjang": "Sarjana",
    "dayaTampung": 42,
    "peminat": 179
  },
  {
    "code": "13731045",
    "name": "PENDIDIKAN ADMINISTRASI PERKANTORAN",
    "jenjang": "Sarjana",
    "dayaTampung": 49,
    "peminat": 459
  },
  {
    "code": "13731046",
    "name": "PENDIDIKAN AKUNTANSI",
    "jenjang": "Sarjana",
    "dayaTampung": 41,
    "peminat": 248
  },
  {
    "code": "13731047",
    "name": "PENDIDIKAN TATA BOGA",
    "jenjang": "Sarjana",
    "dayaTampung": 34,
    "peminat": 352
  },
  {
    "code": "13731048",
    "name": "PENDIDIKAN TATA BUSANA",
    "jenjang": "Sarjana",
    "dayaTampung": 38,
    "peminat": 333
  },
  {
    "code": "13731049",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "dayaTampung": 100,
    "peminat": 1426
  },
  {
    "code": "13731050",
    "name": "BAHASA DAN SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "dayaTampung": 45,
    "peminat": 364
  },
  {
    "code": "13731051",
    "name": "BAHASA DAN SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "dayaTampung": 40,
    "peminat": 500
  },
  {
    "code": "13731052",
    "name": "SEJARAH",
    "jenjang": "Sarjana",
    "dayaTampung": 35,
    "peminat": 152
  },
  {
    "code": "13731053",
    "name": "DESAIN KOMUNIKASI VISUAL",
    "jenjang": "Sarjana",
    "dayaTampung": 52,
    "peminat": 597
  },
  {
    "code": "13731054",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "dayaTampung": 68,
    "peminat": 1148
  },
  {
    "code": "13731055",
    "name": "EKONOMI DAN STUDI PEMBANGUNAN",
    "jenjang": "Sarjana",
    "dayaTampung": 52,
    "peminat": 514
  },
  {
    "code": "13731056",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "dayaTampung": 81,
    "peminat": 1677
  },
  {
    "code": "13731057",
    "name": "PENDIDIKAN KHUSUS",
    "jenjang": "Sarjana",
    "dayaTampung": 55,
    "peminat": 183
  },
  {
    "code": "13731058",
    "name": "PENDIDIKAN GEOGRAFI",
    "jenjang": "Sarjana",
    "dayaTampung": 68,
    "peminat": 314
  },
  {
    "code": "13731059",
    "name": "PENDIDIKAN BAHASA MANDARIN",
    "jenjang": "Sarjana",
    "dayaTampung": 36,
    "peminat": 126
  },
  {
    "code": "13731060",
    "name": "PENDIDIKAN ILMU PENGETAHUAN SOSIAL",
    "jenjang": "Sarjana",
    "dayaTampung": 45,
    "peminat": 286
  },
  {
    "code": "13731061",
    "name": "PENDIDIKAN KEPELATIHAN OLAHRAGA",
    "jenjang": "Sarjana",
    "dayaTampung": 56,
    "peminat": 333
  },
  {
    "code": "13731062",
    "name": "GEOGRAFI",
    "jenjang": "Sarjana",
    "dayaTampung": 49,
    "peminat": 327
  },
  {
    "code": "13731063",
    "name": "PENDIDIKAN SOSIOLOGI",
    "jenjang": "Sarjana",
    "dayaTampung": 56,
    "peminat": 446
  },
  {
    "code": "13731064",
    "name": "ILMU PERPUSTAKAAN",
    "jenjang": "Sarjana",
    "dayaTampung": 47,
    "peminat": 259
  },
  {
    "code": "13731083",
    "name": "GIZI",
    "jenjang": "Sarjana",
    "dayaTampung": 26,
    "peminat": 752
  },
  {
    "code": "13731084",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "dayaTampung": 48,
    "peminat": 1125
  },
  {
    "code": "13731085",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "dayaTampung": 11,
    "peminat": 415
  },
  {
    "code": "13731086",
    "name": "KEPERAWATAN",
    "jenjang": "Sarjana",
    "dayaTampung": 11,
    "peminat": 797
  },
  {
    "code": "13731087",
    "name": "KEBIDANAN",
    "jenjang": "Sarjana",
    "dayaTampung": 11,
    "peminat": 300
  },
  {
    "code": "13731088",
    "name": "HUKUM",
    "jenjang": "Sarjana",
    "dayaTampung": 47,
    "peminat": 549
  },
  {
    "code": "13731089",
    "name": "PARIWISATA",
    "jenjang": "Sarjana",
    "dayaTampung": 38,
    "peminat": 499
  },
  {
    "code": "13731090",
    "name": "ARSITEKTUR",
    "jenjang": "Sarjana",
    "dayaTampung": 25,
    "peminat": 232
  },
  {
    "code": "13731091",
    "name": "TEKNIK LINGKUNGAN",
    "jenjang": "Sarjana",
    "dayaTampung": 23,
    "peminat": 203
  },
  {
    "code": "13731092",
    "name": "SAINS AKTUARIA",
    "jenjang": "Sarjana",
    "dayaTampung": 42,
    "peminat": 111
  },
  {
    "code": "13732023",
    "name": "TEKNOLOGI REKAYASA MANUFAKTUR",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 31,
    "peminat": 114
  },
  {
    "code": "13732024",
    "name": "TEKNOLOGI REKAYASA OTOMOTIF",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 32,
    "peminat": 124
  },
  {
    "code": "13732025",
    "name": "TEKNOLOGI REKAYASA DAN PEMELIHARAAN BANGUNAN SIPIL",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 35,
    "peminat": 155
  },
  {
    "code": "13732026",
    "name": "TEKNOLOGI REKAYASA PEMBANGKIT ENERGI",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 35,
    "peminat": 82
  },
  {
    "code": "13732027",
    "name": "TEKNOLOGI REKAYASA SISTEM ELEKTRONIKA",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 31,
    "peminat": 119
  },
  {
    "code": "13732065",
    "name": "PERPUSTAKAAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 34,
    "peminat": 105
  },
  {
    "code": "13732066",
    "name": "ANIMASI",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 44,
    "peminat": 162
  },
  {
    "code": "13732067",
    "name": "MANAJEMEN PEMASARAN",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 41,
    "peminat": 418
  },
  {
    "code": "13732068",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 41,
    "peminat": 406
  },
  {
    "code": "13732069",
    "name": "TATA BOGA",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 38,
    "peminat": 395
  },
  {
    "code": "13732070",
    "name": "DESAIN MODE",
    "jenjang": "Sarjana Terapan",
    "dayaTampung": 40,
    "peminat": 97
  }
];

const code = data.map((item, index) => {
  let jenjang = 'S1';
  if (item.jenjang === 'Sarjana Terapan') jenjang = 'D4';
  if (item.jenjang === 'Diploma Tiga') jenjang = 'D3';
  const id = `prodi-um-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS NEGERI MALANG (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.dayaTampung} },`;
}).join('\n');

fs.writeFileSync('scratch/um_code.txt', code);
console.log('Done!');
