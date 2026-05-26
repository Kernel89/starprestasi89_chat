import fs from 'fs';
const data = [
  {
    "code": "13531001",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 1220
  },
  {
    "code": "13531002",
    "name": "PSIKOLOGI",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 1225
  },
  {
    "code": "13531003",
    "name": "AGROTEKNOLOGI / AGROEKOTEKNOLOGI",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 525
  },
  {
    "code": "13531004",
    "name": "AGRIBISNIS",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 547
  },
  {
    "code": "13531005",
    "name": "PETERNAKAN",
    "jenjang": "Sarjana",
    "quota": 75,
    "peminat": 481
  },
  {
    "code": "13531006",
    "name": "ILMU DAN TEKNOLOGI PANGAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 626
  },
  {
    "code": "13531007",
    "name": "TEKNIK SIPIL",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 820
  },
  {
    "code": "13531008",
    "name": "ARSITEKTUR",
    "jenjang": "Sarjana",
    "quota": 26,
    "peminat": 417
  },
  {
    "code": "13531009",
    "name": "TEKNIK INDUSTRI",
    "jenjang": "Sarjana",
    "quota": 26,
    "peminat": 786
  },
  {
    "code": "13531010",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 760
  },
  {
    "code": "13531011",
    "name": "TEKNIK KIMIA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 358
  },
  {
    "code": "13531012",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 293
  },
  {
    "code": "13531013",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 139
  },
  {
    "code": "13531014",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 240
  },
  {
    "code": "13531015",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 276
  },
  {
    "code": "13531016",
    "name": "PERENCANAAN WILAYAH DAN KOTA (PWK)",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 343
  },
  {
    "code": "13531017",
    "name": "INFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 1157
  },
  {
    "code": "13531018",
    "name": "PENDIDIKAN FISIKA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 122
  },
  {
    "code": "13531019",
    "name": "PENDIDIKAN KIMIA",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 213
  },
  {
    "code": "13531020",
    "name": "PENDIDIKAN BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 274
  },
  {
    "code": "13531021",
    "name": "PENDIDIKAN MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 316
  },
  {
    "code": "13531022",
    "name": "PENDIDIKAN TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 159
  },
  {
    "code": "13531023",
    "name": "PENDIDIKAN TEKNIK BANGUNAN",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 119
  },
  {
    "code": "13531024",
    "name": "PENDIDIKAN TEKNIK INFORMATIKA & KOMPUTER",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 291
  },
  {
    "code": "13531025",
    "name": "ILMU TANAH",
    "jenjang": "Sarjana",
    "quota": 26,
    "peminat": 227
  },
  {
    "code": "13531026",
    "name": "PENYULUHAN DAN KOMUNIKASI PERTANIAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 250
  },
  {
    "code": "13531027",
    "name": "FARMASI",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 1103
  },
  {
    "code": "13531028",
    "name": "TEKNIK ELEKTRO",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 418
  },
  {
    "code": "13531029",
    "name": "STATISTIKA",
    "jenjang": "Sarjana",
    "quota": 22,
    "peminat": 370
  },
  {
    "code": "13531030",
    "name": "PENDIDIKAN IPA",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 162
  },
  {
    "code": "13531031",
    "name": "ILMU LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 259
  },
  {
    "code": "13531032",
    "name": "PENGELOLAAN HUTAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 239
  },
  {
    "code": "13531034",
    "name": "KEBIDANAN",
    "jenjang": "Sarjana",
    "quota": 14,
    "peminat": 411
  },
  {
    "code": "13531035",
    "name": "ILMU ADMINISTRASI NEGARA",
    "jenjang": "Sarjana",
    "quota": 29,
    "peminat": 599
  },
  {
    "code": "13531036",
    "name": "ILMU KOMUNIKASI",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 969
  },
  {
    "code": "13531037",
    "name": "SOSIOLOGI",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 296
  },
  {
    "code": "13531038",
    "name": "ILMU HUKUM",
    "jenjang": "Sarjana",
    "quota": 120,
    "peminat": 1296
  },
  {
    "code": "13531039",
    "name": "EKONOMI PEMBANGUNAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 572
  },
  {
    "code": "13531040",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 1590
  },
  {
    "code": "13531041",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 35,
    "peminat": 1206
  },
  {
    "code": "13531042",
    "name": "ILMU SEJARAH",
    "jenjang": "Sarjana",
    "quota": 17,
    "peminat": 164
  },
  {
    "code": "13531043",
    "name": "SASTRA INDONESIA",
    "jenjang": "Sarjana",
    "quota": 17,
    "peminat": 262
  },
  {
    "code": "13531044",
    "name": "SASTRA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 416
  },
  {
    "code": "13531045",
    "name": "SASTRA DAERAH UNTUK SASTRA JAWA",
    "jenjang": "Sarjana",
    "quota": 26,
    "peminat": 136
  },
  {
    "code": "13531046",
    "name": "DESAIN MODE",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 66
  },
  {
    "code": "13531047",
    "name": "SENI RUPA",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 51
  },
  {
    "code": "13531048",
    "name": "DESAIN INTERIOR",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 151
  },
  {
    "code": "13531049",
    "name": "DESAIN KOMUNIKASI VISUAL",
    "jenjang": "Sarjana",
    "quota": 30,
    "peminat": 460
  },
  {
    "code": "13531050",
    "name": "PENDIDIKAN SEJARAH",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 167
  },
  {
    "code": "13531051",
    "name": "PENDIDIKAN GEOGRAFI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 245
  },
  {
    "code": "13531052",
    "name": "PEND. PANCASILA & KEWARGANEGARAAN (PPKN)",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 259
  },
  {
    "code": "13531053",
    "name": "PENDIDIKAN LUAR BIASA (PENDIDIKAN KHUSUS)",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 194
  },
  {
    "code": "13531054",
    "name": "PENDIDIKAN JASMANI, KESEHATAN & REKREASI",
    "jenjang": "Sarjana",
    "quota": 32,
    "peminat": 420
  },
  {
    "code": "13531055",
    "name": "PENDIDIKAN KEPELATIHAN OLAHRAGA",
    "jenjang": "Sarjana",
    "quota": 33,
    "peminat": 380
  },
  {
    "code": "13531057",
    "name": "PEND. BAHASA, SASTRA INDONESIA & DAERAH",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 362
  },
  {
    "code": "13531058",
    "name": "PENDIDIKAN BAHASA INGGRIS",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 420
  },
  {
    "code": "13531059",
    "name": "PENDIDIKAN SENI RUPA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 79
  },
  {
    "code": "13531060",
    "name": "PENDIDIKAN SOSIOLOGI ANTROPOLOGI",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 202
  },
  {
    "code": "13531061",
    "name": "PEND. GURU SEKOLAH DASAR (PGSD) SURAKARTA",
    "jenjang": "Sarjana",
    "quota": 43,
    "peminat": 1169
  },
  {
    "code": "13531062",
    "name": "BIMBINGAN DAN KONSELING",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 401
  },
  {
    "code": "13531063",
    "name": "PEND. GURU PEND ANAK USIA DINI (PG-PAUD)",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 166
  },
  {
    "code": "13531064",
    "name": "SASTRA ARAB",
    "jenjang": "Sarjana",
    "quota": 17,
    "peminat": 196
  },
  {
    "code": "13531065",
    "name": "PENDIDIKAN BAHASA JAWA",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 238
  },
  {
    "code": "13531066",
    "name": "PEND. GURU SEKOLAH DASAR (PGSD) KEBUMEN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 334
  },
  {
    "code": "13531067",
    "name": "HUBUNGAN INTERNASIONAL",
    "jenjang": "Sarjana",
    "quota": 18,
    "peminat": 346
  },
  {
    "code": "13531068",
    "name": "PENDIDIKAN AKUNTANSI",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 290
  },
  {
    "code": "13531069",
    "name": "PENDIDIKAN ADMINISTRASI PERKANTORAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 234
  },
  {
    "code": "13531070",
    "name": "PENDIDIKAN EKONOMI",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 272
  },
  {
    "code": "13531094",
    "name": "TEKNOLOGI PENDIDIKAN",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 212
  },
  {
    "code": "13531095",
    "name": "BAHASA MANDARIN DAN KEBUDAYAAN TIONGKOK",
    "jenjang": "Sarjana",
    "quota": 23,
    "peminat": 238
  },
  {
    "code": "13531096",
    "name": "BISNIS DIGITAL",
    "jenjang": "Sarjana",
    "quota": 27,
    "peminat": 1000
  },
  {
    "code": "13531097",
    "name": "SAINS DATA",
    "jenjang": "Sarjana",
    "quota": 12,
    "peminat": 391
  },
  {
    "code": "13531104",
    "name": "ILMU ADMINISTRASI NEGARA (KAMPUS KABUPATEN KEBUMEN)",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 82
  },
  {
    "code": "13531105",
    "name": "INFORMATIKA (KAMPUS KABUPATEN KEBUMEN)",
    "jenjang": "Sarjana",
    "quota": 15,
    "peminat": 78
  },
  {
    "code": "13531106",
    "name": "PROTEKSI TANAMAN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 88
  },
  {
    "code": "13532033",
    "name": "KESELAMATAN DAN KESEHATAN KERJA",
    "jenjang": "Sarjana Terapan",
    "quota": 27,
    "peminat": 988
  },
  {
    "code": "13532071",
    "name": "DEMOGRAFI DAN PENCATATAN SIPIL",
    "jenjang": "Sarjana Terapan",
    "quota": 30,
    "peminat": 262
  },
  {
    "code": "13532098",
    "name": "KEPERAWATAN ANESTESIOLOGI",
    "jenjang": "Sarjana Terapan",
    "quota": 15,
    "peminat": 1279
  },
  {
    "code": "13532099",
    "name": "TEKNIK REKAYASA MANUFAKTUR",
    "jenjang": "Sarjana Terapan",
    "quota": 18,
    "peminat": 117
  },
  {
    "code": "13532100",
    "name": "PEMASARAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 21,
    "peminat": 347
  },
  {
    "code": "13532101",
    "name": "PERBANKAN DAN KEUANGAN DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 24,
    "peminat": 356
  },
  {
    "code": "13532107",
    "name": "BAHASA  MANDARIN UNTUK KOMUNIKASI BISNIS DAN PROFESIONAL",
    "jenjang": "Sarjana Terapan",
    "quota": 18,
    "peminat": 121
  },
  {
    "code": "13532108",
    "name": "MANAJEMEN KONSTRUKSI",
    "jenjang": "Sarjana Terapan",
    "quota": 18,
    "peminat": 0
  },
  {
    "code": "13532109",
    "name": "BAHASA INGGRIS UNTUK KOMUNIKASI BISNIS DAN PROFESIONAL",
    "jenjang": "Sarjana Terapan",
    "quota": 14,
    "peminat": 0
  },
  {
    "code": "13532110",
    "name": "MANAJEMEN BISNIS",
    "jenjang": "Sarjana Terapan",
    "quota": 14,
    "peminat": 0
  },
  {
    "code": "13532111",
    "name": "DESAIN MEDIA DIGITAL",
    "jenjang": "Sarjana Terapan",
    "quota": 12,
    "peminat": 0
  },
  {
    "code": "13532112",
    "name": "MANAJEMEN PERDAGANGAN INTERNASIONAL",
    "jenjang": "Sarjana Terapan",
    "quota": 18,
    "peminat": 0
  },
  {
    "code": "13533072",
    "name": "AKUNTANSI",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 356
  },
  {
    "code": "13533073",
    "name": "KEBIDANAN",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 273
  },
  {
    "code": "13533078",
    "name": "PERPAJAKAN",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 313
  },
  {
    "code": "13533081",
    "name": "USAHA PERJALANAN WISATA",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 260
  },
  {
    "code": "13533082",
    "name": "AGRIBISNIS",
    "jenjang": "Diploma Tiga",
    "quota": 26,
    "peminat": 215
  },
  {
    "code": "13533083",
    "name": "TEKNIK KIMIA",
    "jenjang": "Diploma Tiga",
    "quota": 10,
    "peminat": 61
  },
  {
    "code": "13533089",
    "name": "FARMASI",
    "jenjang": "Diploma Tiga",
    "quota": 17,
    "peminat": 702
  },
  {
    "code": "13533090",
    "name": "BUDI DAYA TERNAK",
    "jenjang": "Diploma Tiga",
    "quota": 12,
    "peminat": 77
  },
  {
    "code": "13533091",
    "name": "MANAJEMEN ADMINISTRASI",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 419
  },
  {
    "code": "13533102",
    "name": "TEKNIK INFORMATIKA (KAMPUS KABUPATEN MADIUN)",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 31
  },
  {
    "code": "13533103",
    "name": "AKUNTANSI (KAMPUS KABUPATEN MADIUN)",
    "jenjang": "Diploma Tiga",
    "quota": 18,
    "peminat": 20
  }
];

const code = data.map((item, index) => {
  let jenjang = 'S1';
  if (item.jenjang === 'Sarjana Terapan') jenjang = 'D4';
  if (item.jenjang === 'Diploma Tiga') jenjang = 'D3';
  const id = `prodi-uns-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'UNIVERSITAS SEBELAS MARET (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/uns_code.txt', code);
console.log('Done!');
