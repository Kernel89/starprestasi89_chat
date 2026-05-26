import fs from 'fs';
const data = [
  {
    "code": "13811001",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 1659
  },
  {
    "code": "13811002",
    "name": "KEDOKTERAN GIGI",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 802
  },
  {
    "code": "13811003",
    "name": "FARMASI",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 1391
  },
  {
    "code": "13811004",
    "name": "KEDOKTERAN HEWAN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 383
  },
  {
    "code": "13811005",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 214
  },
  {
    "code": "13811006",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 226
  },
  {
    "code": "13811007",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 121
  },
  {
    "code": "13811008",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 256
  },
  {
    "code": "13811009",
    "name": "KESEHATAN MASYARAKAT",
    "jenjang": "Sarjana",
    "quota": 72,
    "peminat": 923
  },
  {
    "code": "13811010",
    "name": "KEPERAWATAN",
    "jenjang": "Sarjana",
    "quota": 72,
    "peminat": 1022
  },
  {
    "code": "13811011",
    "name": "AKUAKULTUR",
    "jenjang": "Sarjana",
    "quota": 64,
    "peminat": 180
  },
  {
    "code": "13811012",
    "name": "KEBIDANAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 407
  },
  {
    "code": "13811013",
    "name": "TEKNIK BIOMEDIS",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 496
  },
  {
    "code": "13811014",
    "name": "TEKNIK LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 399
  },
  {
    "code": "13811015",
    "name": "SISTEM INFORMASI",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 452
  },
  {
    "code": "13811016",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 329
  },
  {
    "code": "13811017",
    "name": "GIZI",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 688
  },
  {
    "code": "13811018",
    "name": "KEDOKTERAN HEWAN (FIKKIA BANYUWANGI)",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 203
  },
  {
    "code": "13811019",
    "name": "KESEHATAN MASYARAKAT (FIKKIA BANYUWANGI)",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 263
  },
  {
    "code": "13811020",
    "name": "AKUAKULTUR (FIKKIA BANYUWANGI)",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 71
  },
  {
    "code": "13811021",
    "name": "TEKNOLOGI HASIL PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 179
  },
  {
    "code": "13811022",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 424
  },
  {
    "code": "13811023",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 241
  },
  {
    "code": "13811024",
    "name": "REKAYASA NANOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 168
  },
  {
    "code": "13811025",
    "name": "TEKNOLOGI SAINS DATA",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 288
  },
  {
    "code": "13811026",
    "name": "TEKNIK ROBOTIKA DAN KECERDASAN BUATAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 298
  },
  {
    "code": "13811027",
    "name": "ILMU HUKUM",
    "jenjang": "Sarjana",
    "quota": 77,
    "peminat": 1089
  },
  {
    "code": "13811028",
    "name": "ADMINISTRASI PUBLIK",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 432
  },
  {
    "code": "13811029",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 54,
    "peminat": 1066
  },
  {
    "code": "13811030",
    "name": "SOSIOLOGI",
    "jenjang": "Sarjana",
    "quota": 39,
    "peminat": 259
  },
  {
    "code": "13811031",
    "name": "ILMU POLITIK",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 278
  },
  {
    "code": "13811032",
    "name": "ILMU HUBUNGAN INTERNASIONAL",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 492
  },
  {
    "code": "13811033",
    "name": "ANTROPOLOGI",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 225
  },
  {
    "code": "13811034",
    "name": "ILMU EKONOMI",
    "jenjang": "Sarjana",
    "quota": 66,
    "peminat": 533
  },
  {
    "code": "13811035",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 1001
  },
  {
    "code": "13811036",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 53,
    "peminat": 1043
  },
  {
    "code": "13811037",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 674
  },
  {
    "code": "13811038",
    "name": "ILMU SEJARAH",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 111
  },
  {
    "code": "13811039",
    "name": "ILMU INFORMASI DAN PERPUSTAKAAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 253
  },
  {
    "code": "13811040",
    "name": "BAHASA DAN SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 75,
    "peminat": 562
  },
  {
    "code": "13811041",
    "name": "BAHASA DAN SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 199
  },
  {
    "code": "13811042",
    "name": "BAHASA DAN SASTRA JEPANG",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 236
  },
  {
    "code": "13811043",
    "name": "EKONOMI ISLAM",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 339
  },
  {
    "code": "13811068",
    "name": "KEDOKTERAN (FIKKIA BANYUWANGI)",
    "jenjang": "Sarjana",
    "quota": 10,
    "peminat": 141
  },
  {
    "code": "13812046",
    "name": "KESELAMATAN DAN KESEHATAN KERJA",
    "jenjang": "Sarjana Terapan",
    "quota": 40,
    "peminat": 903
  },
  {
    "code": "13812049",
    "name": "MANAJEMEN PERHOTELAN",
    "jenjang": "Sarjana Terapan",
    "quota": 27,
    "peminat": 295
  },
  {
    "code": "13812050",
    "name": "DESTINASI PARIWISATA",
    "jenjang": "Sarjana Terapan",
    "quota": 27,
    "peminat": 290
  },
  {
    "code": "13812051",
    "name": "TEKNOLOGI LABORATORIUM MEDIK",
    "jenjang": "Sarjana Terapan",
    "quota": 30,
    "peminat": 976
  },
  {
    "code": "13812054",
    "name": "PERBANKAN DAN KEUANGAN",
    "jenjang": "Sarjana Terapan",
    "quota": 45,
    "peminat": 393
  },
  {
    "code": "13812055",
    "name": "TEKNOLOGI REKAYASA INSTRUMENTASI DAN KONTROL",
    "jenjang": "Sarjana Terapan",
    "quota": 32,
    "peminat": 106
  },
  {
    "code": "13812056",
    "name": "MANAJEMEN PERKANTORAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 48,
    "peminat": 371
  },
  {
    "code": "13812061",
    "name": "PENGOBAT TRADISIONAL",
    "jenjang": "Sarjana Terapan",
    "quota": 20,
    "peminat": 64
  },
  {
    "code": "13812062",
    "name": "FISIOTERAPI",
    "jenjang": "Sarjana Terapan",
    "quota": 36,
    "peminat": 536
  },
  {
    "code": "13812063",
    "name": "TEKNOLOGI RADIOLOGI PENCITRAAN",
    "jenjang": "Sarjana Terapan",
    "quota": 40,
    "peminat": 873
  },
  {
    "code": "13812064",
    "name": "TEKNIK INFORMATIKA",
    "jenjang": "Sarjana Terapan",
    "quota": 36,
    "peminat": 312
  },
  {
    "code": "13812065",
    "name": "TEKNOLOGI KESEHATAN GIGI",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 108
  },
  {
    "code": "13812066",
    "name": "TEKNOLOGI VETERINER",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 67
  },
  {
    "code": "13812067",
    "name": "KEARSIPAN DAN INFORMASI DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 29,
    "peminat": 170
  },
  {
    "code": "13812069",
    "name": "AKUNTANSI BISNIS DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 27,
    "peminat": 0
  },
  {
    "code": "13813045",
    "name": "BAHASA INGGRIS",
    "jenjang": "Diploma Tiga",
    "quota": 30,
    "peminat": 98
  },
  {
    "code": "13813047",
    "name": "PERPAJAKAN",
    "jenjang": "Diploma Tiga",
    "quota": 60,
    "peminat": 268
  },
  {
    "code": "13813059",
    "name": "KEPERAWATAN",
    "jenjang": "Diploma Tiga",
    "quota": 60,
    "peminat": 470
  }
];

const code = data.map((item, index) => {
  let jenjang = 'S1';
  if (item.jenjang === 'Sarjana Terapan') jenjang = 'D4';
  if (item.jenjang === 'Diploma Tiga') jenjang = 'D3';
  const id = `prodi-unair-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS AIRLANGGA (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/unair_code.txt', code);
console.log('Done!');
