import fs from 'fs';
const data = [
  {
    "code": "13331001",
    "name": "PENDIDIKAN DOKTER",
    "jenjang": "Sarjana",
    "quota": 67,
    "peminat": 1572
  },
  {
    "code": "13331002",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 34,
    "peminat": 419
  },
  {
    "code": "13331003",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 455
  },
  {
    "code": "13331004",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 34,
    "peminat": 329
  },
  {
    "code": "13331005",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 465
  },
  {
    "code": "13331006",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 480
  },
  {
    "code": "13331007",
    "name": "AGROTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 134,
    "peminat": 983
  },
  {
    "code": "13331008",
    "name": "AGRIBISNIS",
    "jenjang": "Sarjana",
    "quota": 41,
    "peminat": 490
  },
  {
    "code": "13331009",
    "name": "PENDIDIKAN DOKTER GIGI",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 705
  },
  {
    "code": "13331010",
    "name": "ILMU PETERNAKAN",
    "jenjang": "Sarjana",
    "quota": 122,
    "peminat": 774
  },
  {
    "code": "13331011",
    "name": "PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 69,
    "peminat": 505
  },
  {
    "code": "13331012",
    "name": "ILMU KEPERAWATAN",
    "jenjang": "Sarjana",
    "quota": 58,
    "peminat": 2152
  },
  {
    "code": "13331013",
    "name": "ILMU KELAUTAN",
    "jenjang": "Sarjana",
    "quota": 43,
    "peminat": 508
  },
  {
    "code": "13331014",
    "name": "TEKNOLOGI  PANGAN",
    "jenjang": "Sarjana",
    "quota": 41,
    "peminat": 873
  },
  {
    "code": "13331015",
    "name": "TEKNIK PERTANIAN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 602
  },
  {
    "code": "13331016",
    "name": "FARMASI",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 2311
  },
  {
    "code": "13331017",
    "name": "TEKNIK GEOLOGI",
    "jenjang": "Sarjana",
    "quota": 54,
    "peminat": 902
  },
  {
    "code": "13331018",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 47,
    "peminat": 2028
  },
  {
    "code": "13331019",
    "name": "GEOFISIKA",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 319
  },
  {
    "code": "13331020",
    "name": "TEKNIK INFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 23,
    "peminat": 1514
  },
  {
    "code": "13331021",
    "name": "TEKNOLOGI INDUSTRI PERTANIAN",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 387
  },
  {
    "code": "13331022",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 665
  },
  {
    "code": "13331023",
    "name": "KEDOKTERAN HEWAN",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 293
  },
  {
    "code": "13331028",
    "name": "ILMU AKTUARIA",
    "jenjang": "Sarjana",
    "quota": 13,
    "peminat": 340
  },
  {
    "code": "13331030",
    "name": "PERIKANAN PSDKU PANGANDARAN",
    "jenjang": "Sarjana",
    "quota": 23,
    "peminat": 161
  },
  {
    "code": "13331031",
    "name": "PETERNAKAN PSDKU PANGANDARAN",
    "jenjang": "Sarjana",
    "quota": 13,
    "peminat": 121
  },
  {
    "code": "13331032",
    "name": "KEPERAWATAN PSDKU PANGANDARAN",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 293
  },
  {
    "code": "13331033",
    "name": "ILMU HUKUM",
    "jenjang": "Sarjana",
    "quota": 88,
    "peminat": 2079
  },
  {
    "code": "13331034",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 1341
  },
  {
    "code": "13331035",
    "name": "ILMU EKONOMI",
    "jenjang": "Sarjana",
    "quota": 41,
    "peminat": 872
  },
  {
    "code": "13331036",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 1654
  },
  {
    "code": "13331037",
    "name": "ADMINISTRASI PUBLIK",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 758
  },
  {
    "code": "13331038",
    "name": "ILMU HUBUNGAN INTERNASIONAL",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 752
  },
  {
    "code": "13331039",
    "name": "ILMU KESEJAHTERAAN SOSIAL",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 348
  },
  {
    "code": "13331040",
    "name": "ILMU PEMERINTAHAN",
    "jenjang": "Sarjana",
    "quota": 21,
    "peminat": 368
  },
  {
    "code": "13331041",
    "name": "ANTROPOLOGI",
    "jenjang": "Sarjana",
    "quota": 13,
    "peminat": 358
  },
  {
    "code": "13331042",
    "name": "ILMU ADMINISTRASI BISNIS",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 970
  },
  {
    "code": "13331043",
    "name": "SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 395
  },
  {
    "code": "13331044",
    "name": "SASTRA SUNDA",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 233
  },
  {
    "code": "13331045",
    "name": "ILMU SEJARAH",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 458
  },
  {
    "code": "13331046",
    "name": "SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 800
  },
  {
    "code": "13331047",
    "name": "SASTRA PERANCIS",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 214
  },
  {
    "code": "13331048",
    "name": "SASTRA JEPANG",
    "jenjang": "Sarjana",
    "quota": 39,
    "peminat": 562
  },
  {
    "code": "13331049",
    "name": "SASTRA RUSIA",
    "jenjang": "Sarjana",
    "quota": 21,
    "peminat": 160
  },
  {
    "code": "13331050",
    "name": "SASTRA JERMAN",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 295
  },
  {
    "code": "13331051",
    "name": "SASTRA ARAB",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 395
  },
  {
    "code": "13331052",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 31,
    "peminat": 1541
  },
  {
    "code": "13331053",
    "name": "PERPUSTAKAAN DAN SAINS INFORMASI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 329
  },
  {
    "code": "13331054",
    "name": "SOSIOLOGI",
    "jenjang": "Sarjana",
    "quota": 14,
    "peminat": 385
  },
  {
    "code": "13331055",
    "name": "ILMU POLITIK",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 302
  },
  {
    "code": "13331056",
    "name": "HUBUNGAN MASYARAKAT",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 455
  },
  {
    "code": "13331057",
    "name": "EKONOMI ISLAM",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 368
  },
  {
    "code": "13331058",
    "name": "MANAJEMEN KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 34,
    "peminat": 569
  },
  {
    "code": "13331059",
    "name": "JURNALISTIK",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 408
  },
  {
    "code": "13331060",
    "name": "TELEVISI DAN FILM",
    "jenjang": "Sarjana",
    "quota": 34,
    "peminat": 537
  },
  {
    "code": "13331064",
    "name": "BISNIS DIGITAL",
    "jenjang": "Sarjana",
    "quota": 25,
    "peminat": 1004
  },
  {
    "code": "13331065",
    "name": "ADMINISTRASI BISNIS PSDKU PANGANDARAN",
    "jenjang": "Sarjana",
    "quota": 13,
    "peminat": 270
  },
  {
    "code": "13331066",
    "name": "ILMU KOMUNIKASI PSDKU PANGANDARAN",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 225
  },
  {
    "code": "13331081",
    "name": "REKAYASA KOSMETIK",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 0
  },
  {
    "code": "13332067",
    "name": "AKUNTANSI PERPAJAKAN",
    "jenjang": "Sarjana Terapan",
    "quota": 30,
    "peminat": 515
  },
  {
    "code": "13332068",
    "name": "AKUNTANSI SEKTOR PUBLIK",
    "jenjang": "Sarjana Terapan",
    "quota": 39,
    "peminat": 578
  },
  {
    "code": "13332069",
    "name": "BISNIS INTERNASIONAL",
    "jenjang": "Sarjana Terapan",
    "quota": 20,
    "peminat": 299
  },
  {
    "code": "13332070",
    "name": "PEMASARAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 13,
    "peminat": 220
  },
  {
    "code": "13332071",
    "name": "KEBIDANAN",
    "jenjang": "Sarjana Terapan",
    "quota": 10,
    "peminat": 558
  },
  {
    "code": "13332072",
    "name": "TEKNOLOGI INDUSTRI KIMIA",
    "jenjang": "Sarjana Terapan",
    "quota": 18,
    "peminat": 254
  },
  {
    "code": "13332073",
    "name": "AGROTEKNOPRENEUR",
    "jenjang": "Sarjana Terapan",
    "quota": 25,
    "peminat": 157
  },
  {
    "code": "13332074",
    "name": "ADMINISTRASI KEUANGAN PUBLIK",
    "jenjang": "Sarjana Terapan",
    "quota": 19,
    "peminat": 296
  },
  {
    "code": "13332075",
    "name": "ADMINISTRASI PEMERINTAHAN",
    "jenjang": "Sarjana Terapan",
    "quota": 16,
    "peminat": 208
  },
  {
    "code": "13332076",
    "name": "BISNIS LOGISTIK",
    "jenjang": "Sarjana Terapan",
    "quota": 17,
    "peminat": 200
  },
  {
    "code": "13332077",
    "name": "KEARSIPAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 11,
    "peminat": 188
  },
  {
    "code": "13332078",
    "name": "BAHASA DAN BUDAYA TIONGKOK",
    "jenjang": "Sarjana Terapan",
    "quota": 16,
    "peminat": 235
  },
  {
    "code": "13332079",
    "name": "MANAJEMEN PRODUKSI MEDIA",
    "jenjang": "Sarjana Terapan",
    "quota": 25,
    "peminat": 317
  },
  {
    "code": "13332080",
    "name": "PARIWISATA BAHARI",
    "jenjang": "Sarjana Terapan",
    "quota": 39,
    "peminat": 433
  }
];

const code = data.map((item, index) => {
  const jenjang = item.jenjang === 'Sarjana' ? 'S1' : 'D4';
  const id = `prodi-unpad-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS PADJADJARAN (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/unpad_code.txt', code);
console.log('Done!');
