import fs from 'fs';
const data = [
  {
    "code": "13721001",
    "name": "MANAJEMEN SUMBERDAYA PERAIRAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 119
  },
  {
    "code": "13721002",
    "name": "BUDIDAYA PERAIRAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 142
  },
  {
    "code": "13721003",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 523
  },
  {
    "code": "13721004",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 433
  },
  {
    "code": "13721005",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 435
  },
  {
    "code": "13721006",
    "name": "ARSITEKTUR",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 412
  },
  {
    "code": "13721007",
    "name": "TEKNIK PENGAIRAN",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 194
  },
  {
    "code": "13721008",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 64,
    "peminat": 1456
  },
  {
    "code": "13721009",
    "name": "TEKNOLOGI PANGAN",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 839
  },
  {
    "code": "13721010",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 215
  },
  {
    "code": "13721011",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 94
  },
  {
    "code": "13721012",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 283
  },
  {
    "code": "13721013",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 199
  },
  {
    "code": "13721014",
    "name": "PEMANFAATAN SUMBERDAYA PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 161
  },
  {
    "code": "13721015",
    "name": "TEKNOLOGI HASIL PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 147
  },
  {
    "code": "13721016",
    "name": "AGROBISNIS PERIKANAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 144
  },
  {
    "code": "13721017",
    "name": "TEKNIK PERTANIAN DAN BIOSISTEM",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 248
  },
  {
    "code": "13721018",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 386
  },
  {
    "code": "13721019",
    "name": "PERENCANAAN WILAYAH & KOTA",
    "jenjang": "Sarjana",
    "quota": 37,
    "peminat": 351
  },
  {
    "code": "13721020",
    "name": "TEKNIK INDUSTRI PERTANIAN",
    "jenjang": "Sarjana",
    "quota": 70,
    "peminat": 439
  },
  {
    "code": "13721021",
    "name": "ILMU KEPERAWATAN",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 916
  },
  {
    "code": "13721023",
    "name": "ILMU GIZI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 669
  },
  {
    "code": "13721024",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 818
  },
  {
    "code": "13721025",
    "name": "TEKNIK INFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 1009
  },
  {
    "code": "13721026",
    "name": "AGROEKOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 179,
    "peminat": 744
  },
  {
    "code": "13721027",
    "name": "AGRIBISNIS",
    "jenjang": "Sarjana",
    "quota": 104,
    "peminat": 652
  },
  {
    "code": "13721028",
    "name": "PETERNAKAN",
    "jenjang": "Sarjana",
    "quota": 159,
    "peminat": 724
  },
  {
    "code": "13721029",
    "name": "PENDIDIKAN DOKTER HEWAN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 373
  },
  {
    "code": "13721030",
    "name": "PENDIDIKAN DOKTER GIGI",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 577
  },
  {
    "code": "13721031",
    "name": "ILMU KELAUTAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 198
  },
  {
    "code": "13721032",
    "name": "KEBIDANAN",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 474
  },
  {
    "code": "13721033",
    "name": "FARMASI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 1203
  },
  {
    "code": "13721035",
    "name": "TEKNIK KOMPUTER",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 350
  },
  {
    "code": "13721036",
    "name": "SISTEM INFORMASI",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 733
  },
  {
    "code": "13721037",
    "name": "TEKNIK KIMIA",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 377
  },
  {
    "code": "13721038",
    "name": "INSTRUMENTASI",
    "jenjang": "Sarjana",
    "quota": 23,
    "peminat": 109
  },
  {
    "code": "13721039",
    "name": "TEKNIK GEOFISIKA",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 246
  },
  {
    "code": "13721040",
    "name": "BIOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 423
  },
  {
    "code": "13721042",
    "name": "TEKNOLOGI BIOPROSES",
    "jenjang": "Sarjana",
    "quota": 25,
    "peminat": 256
  },
  {
    "code": "13721043",
    "name": "TEKNIK LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 465
  },
  {
    "code": "13721046",
    "name": "PENDIDIKAN TEKNOLOGI INFORMASI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 159
  },
  {
    "code": "13721047",
    "name": "TEKNOLOGI INFORMASI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 462
  },
  {
    "code": "13721048",
    "name": "AGROEKOTEKNOLOGI (PSDKU KEDIRI)",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 224
  },
  {
    "code": "13721049",
    "name": "AGRIBISNIS (PSDKU KEDIRI)",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 249
  },
  {
    "code": "13721050",
    "name": "PETERNAKAN (PSDKU KEDIRI)",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 194
  },
  {
    "code": "13721051",
    "name": "AKUAKULTUR (PSDKU KEDIRI)",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 109
  },
  {
    "code": "13721052",
    "name": "SOSIAL EKONOMI PERIKANAN (PSDKU KEDIRI)",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 96
  },
  {
    "code": "13721053",
    "name": "KEHUTANAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 286
  },
  {
    "code": "13721054",
    "name": "ILMU AKTUARIA",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 249
  },
  {
    "code": "13721056",
    "name": "ILMU HUKUM",
    "jenjang": "Sarjana",
    "quota": 133,
    "peminat": 1255
  },
  {
    "code": "13721057",
    "name": "EKONOMI PEMBANGUNAN",
    "jenjang": "Sarjana",
    "quota": 35,
    "peminat": 356
  },
  {
    "code": "13721058",
    "name": "ADMINISTRASI PUBLIK",
    "jenjang": "Sarjana",
    "quota": 82,
    "peminat": 763
  },
  {
    "code": "13721059",
    "name": "ADMINISTRASI BISNIS",
    "jenjang": "Sarjana",
    "quota": 93,
    "peminat": 1413
  },
  {
    "code": "13721060",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 75,
    "peminat": 1025
  },
  {
    "code": "13721061",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 94,
    "peminat": 1147
  },
  {
    "code": "13721062",
    "name": "SOSIOLOGI",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 355
  },
  {
    "code": "13721063",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 911
  },
  {
    "code": "13721064",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 58,
    "peminat": 1033
  },
  {
    "code": "13721065",
    "name": "HUBUNGAN INTERNASIONAL",
    "jenjang": "Sarjana",
    "quota": 50,
    "peminat": 559
  },
  {
    "code": "13721066",
    "name": "SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 58,
    "peminat": 488
  },
  {
    "code": "13721067",
    "name": "SASTRA JEPANG",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 296
  },
  {
    "code": "13721068",
    "name": "BAHASA DAN SASTRA PRANCIS",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 73
  },
  {
    "code": "13721069",
    "name": "ILMU POLITIK",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 258
  },
  {
    "code": "13721070",
    "name": "ILMU PEMERINTAHAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 310
  },
  {
    "code": "13721072",
    "name": "PERPAJAKAN",
    "jenjang": "Sarjana",
    "quota": 55,
    "peminat": 612
  },
  {
    "code": "13721075",
    "name": "EKONOMI ISLAM",
    "jenjang": "Sarjana",
    "quota": 31,
    "peminat": 259
  },
  {
    "code": "13721076",
    "name": "EKONOMI, KEUANGAN DAN PERBANKAN",
    "jenjang": "Sarjana",
    "quota": 47,
    "peminat": 586
  },
  {
    "code": "13721077",
    "name": "ILMU PERPUSTAKAAN",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 176
  },
  {
    "code": "13721078",
    "name": "PARIWISATA",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 460
  },
  {
    "code": "13721080",
    "name": "PENDIDIKAN BAHASA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 45,
    "peminat": 279
  },
  {
    "code": "13721081",
    "name": "PENDIDIKAN BAHASA JEPANG",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 109
  },
  {
    "code": "13721082",
    "name": "PENDIDIKAN BHS & SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 209
  },
  {
    "code": "13721085",
    "name": "ADMINISTRASI PENDIDIKAN",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 150
  },
  {
    "code": "13721086",
    "name": "SENI RUPA MURNI",
    "jenjang": "Sarjana",
    "quota": 19,
    "peminat": 47
  },
  {
    "code": "13721087",
    "name": "SASTRA CINA",
    "jenjang": "Sarjana",
    "quota": 25,
    "peminat": 323
  },
  {
    "code": "13721088",
    "name": "ANTROPOLOGI",
    "jenjang": "Sarjana",
    "quota": 23,
    "peminat": 204
  },
  {
    "code": "13721089",
    "name": "KEWIRAUSAHAAN",
    "jenjang": "Sarjana",
    "quota": 21,
    "peminat": 314
  },
  {
    "code": "13721094",
    "name": "SAINS DATA",
    "jenjang": "Sarjana",
    "quota": 14,
    "peminat": 298
  },
  {
    "code": "13721095",
    "name": "BIOINFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 0
  },
  {
    "code": "13721096",
    "name": "INDUSTRI PETERNAKAN CERDAS",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 0
  },
  {
    "code": "13722055",
    "name": "DESAIN GRAFIS",
    "jenjang": "Sarjana Terapan",
    "quota": 42,
    "peminat": 196
  },
  {
    "code": "13722090",
    "name": "MANAJEMEN PERHOTELAN",
    "jenjang": "Sarjana Terapan",
    "quota": 58,
    "peminat": 240
  },
  {
    "code": "13723091",
    "name": "KEUANGAN DAN PERBANKAN",
    "jenjang": "Diploma Tiga",
    "quota": 75,
    "peminat": 230
  },
  {
    "code": "13723092",
    "name": "ADMINISTRASI BISNIS",
    "jenjang": "Diploma Tiga",
    "quota": 79,
    "peminat": 256
  },
  {
    "code": "13723093",
    "name": "TEKNOLOGI INFORMASI",
    "jenjang": "Diploma Tiga",
    "quota": 78,
    "peminat": 165
  }
];

const code = data.map((item, index) => {
  let jenjang = 'S1';
  if (item.jenjang === 'Sarjana Terapan') jenjang = 'D4';
  if (item.jenjang === 'Diploma Tiga') jenjang = 'D3';
  const id = `prodi-ub-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS BRAWIJAYA (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/ub_code.txt', code);
console.log('Done!');
