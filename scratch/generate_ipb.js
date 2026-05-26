import fs from 'fs';
const data = [
  {
    "code": "13411001",
    "name": "AGRIBISNIS",
    "jenjang": "Sarjana",
    "quota": 60,
    "peminat": 892
  },
  {
    "code": "13411002",
    "name": "AGRONOMI DAN HORTIKULTURA",
    "jenjang": "Sarjana",
    "quota": 90,
    "peminat": 826
  },
  {
    "code": "13411003",
    "name": "ARSITEKTUR LANSKAP",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 416
  },
  {
    "code": "13411004",
    "name": "BIOKIMIA",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 451
  },
  {
    "code": "13411005",
    "name": "BIOLOGI",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 421
  },
  {
    "code": "13411006",
    "name": "EKONOMI SUMBERDAYA DAN LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 544
  },
  {
    "code": "13411007",
    "name": "ILMU DAN TEKNOLOGI KELAUTAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 402
  },
  {
    "code": "13411008",
    "name": "ILMU KOMPUTER",
    "jenjang": "Sarjana",
    "quota": 68,
    "peminat": 1364
  },
  {
    "code": "13411009",
    "name": "KEDOKTERAN HEWAN",
    "jenjang": "Sarjana",
    "quota": 88,
    "peminat": 691
  },
  {
    "code": "13411010",
    "name": "KIMIA",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 487
  },
  {
    "code": "13411011",
    "name": "KOMUNIKASI DAN PENGEMBANGAN MASYARAKAT",
    "jenjang": "Sarjana",
    "quota": 70,
    "peminat": 1053
  },
  {
    "code": "13411012",
    "name": "KONSERVASI SUMBERDAYA HUTAN DAN EKOWISATA",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 478
  },
  {
    "code": "13411013",
    "name": "MANAJEMEN HUTAN",
    "jenjang": "Sarjana",
    "quota": 56,
    "peminat": 518
  },
  {
    "code": "13411014",
    "name": "STATISTIKA DAN SAINS DATA",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 987
  },
  {
    "code": "13411015",
    "name": "TEKNIK PERTANIAN DAN BIOSISTEM",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 537
  },
  {
    "code": "13411016",
    "name": "TEKNOLOGI HASIL HUTAN",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 321
  },
  {
    "code": "13411017",
    "name": "TEKNIK INDUSTRI PERTANIAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 881
  },
  {
    "code": "13411018",
    "name": "TEKNOLOGI PANGAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 1279
  },
  {
    "code": "13411019",
    "name": "NUTRISI DAN TEKNOLOGI PAKAN",
    "jenjang": "Sarjana",
    "quota": 64,
    "peminat": 505
  },
  {
    "code": "13411020",
    "name": "TEKNOLOGI PRODUKSI TERNAK",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 319
  },
  {
    "code": "13411021",
    "name": "TEKNIK SIPIL DAN LINGKUNGAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 744
  },
  {
    "code": "13411022",
    "name": "TEKNOLOGI DAN MANAJEMEN PERIKANAN BUDIDAYA",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 259
  },
  {
    "code": "13411023",
    "name": "EKONOMI PEMBANGUNAN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 690
  },
  {
    "code": "13411024",
    "name": "MANAJEMEN",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 1399
  },
  {
    "code": "13411025",
    "name": "ILMU GIZI",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 1170
  },
  {
    "code": "13411026",
    "name": "ILMU EKONOMI SYARIAH",
    "jenjang": "Sarjana",
    "quota": 52,
    "peminat": 531
  },
  {
    "code": "13411027",
    "name": "MANAJEMEN SUMBERDAYA LAHAN",
    "jenjang": "Sarjana",
    "quota": 36,
    "peminat": 402
  },
  {
    "code": "13411028",
    "name": "PROTEKSI TANAMAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 358
  },
  {
    "code": "13411029",
    "name": "MANAJEMEN SUMBERDAYA PERAIRAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 264
  },
  {
    "code": "13411030",
    "name": "TEKNOLOGI HASIL PERAIRAN",
    "jenjang": "Sarjana",
    "quota": 42,
    "peminat": 238
  },
  {
    "code": "13411031",
    "name": "TEKNOLOGI DAN MANAJEMEN PERIKANAN TANGKAP",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 229
  },
  {
    "code": "13411032",
    "name": "SILVIKULTUR",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 338
  },
  {
    "code": "13411033",
    "name": "METEOROLOGI TERAPAN",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 341
  },
  {
    "code": "13411034",
    "name": "MATEMATIKA",
    "jenjang": "Sarjana",
    "quota": 44,
    "peminat": 390
  },
  {
    "code": "13411035",
    "name": "FISIKA",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 264
  },
  {
    "code": "13411036",
    "name": "ILMU KELUARGA DAN KONSUMEN",
    "jenjang": "Sarjana",
    "quota": 48,
    "peminat": 474
  },
  {
    "code": "13411037",
    "name": "BISNIS",
    "jenjang": "Sarjana",
    "quota": 96,
    "peminat": 1140
  },
  {
    "code": "13411038",
    "name": "TEKNOLOGI HASIL TERNAK",
    "jenjang": "Sarjana",
    "quota": 40,
    "peminat": 305
  },
  {
    "code": "13411039",
    "name": "AKTUARIA",
    "jenjang": "Sarjana",
    "quota": 38,
    "peminat": 591
  },
  {
    "code": "13411063",
    "name": "KEDOKTERAN",
    "jenjang": "Sarjana",
    "quota": 10,
    "peminat": 716
  },
  {
    "code": "13411064",
    "name": "SAINS BIOMEDIS",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 444
  },
  {
    "code": "13411070",
    "name": "SMART AGRICULTURE",
    "jenjang": "Sarjana",
    "quota": 16,
    "peminat": 297
  },
  {
    "code": "13411071",
    "name": "BIOINFORMATIKA",
    "jenjang": "Sarjana",
    "quota": 20,
    "peminat": 182
  },
  {
    "code": "13411072",
    "name": "KECERDASAN BUATAN",
    "jenjang": "Sarjana",
    "quota": 28,
    "peminat": 619
  },
  {
    "code": "13411074",
    "name": "TEKNIK MESIN",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 0
  },
  {
    "code": "13411076",
    "name": "TEKNIK KIMIA",
    "jenjang": "Sarjana",
    "quota": 24,
    "peminat": 0
  },
  {
    "code": "13412042",
    "name": "KOMUNIKASI DIGITAL DAN MEDIA",
    "jenjang": "Sarjana Terapan",
    "quota": 84,
    "peminat": 1377
  },
  {
    "code": "13412043",
    "name": "KOMUNIKASI DIGITAL DAN MEDIA (KAMPUS SUKABUMI)",
    "jenjang": "Sarjana Terapan",
    "quota": 54,
    "peminat": 309
  },
  {
    "code": "13412044",
    "name": "EKOWISATA",
    "jenjang": "Sarjana Terapan",
    "quota": 40,
    "peminat": 420
  },
  {
    "code": "13412045",
    "name": "EKOWISATA (KAMPUS SUKABUMI)",
    "jenjang": "Sarjana Terapan",
    "quota": 36,
    "peminat": 189
  },
  {
    "code": "13412046",
    "name": "TEKNOLOGI REKAYASA PERANGKAT LUNAK",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 635
  },
  {
    "code": "13412047",
    "name": "TEKNOLOGI REKAYASA KOMPUTER",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 545
  },
  {
    "code": "13412048",
    "name": "SUPERVISOR JAMINAN MUTU PANGAN",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 575
  },
  {
    "code": "13412049",
    "name": "MANAJEMEN INDUSTRI JASA MAKANAN DAN GIZI",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 639
  },
  {
    "code": "13412050",
    "name": "TEKNOLOGI DAN MANAJEMEN PEMBENIHAN IKAN",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 147
  },
  {
    "code": "13412051",
    "name": "TEKNOLOGI DAN MANAJEMEN PEMBENIHAN IKAN (KAMPUS SUKABUMI)",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 79
  },
  {
    "code": "13412052",
    "name": "TEKNOLOGI DAN MANAJEMEN TERNAK",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 266
  },
  {
    "code": "13412053",
    "name": "TEKNOLOGI DAN MANAJEMEN TERNAK (KAMPUS SUKABUMI)",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 109
  },
  {
    "code": "13412054",
    "name": "MANAJEMEN AGRIBISNIS",
    "jenjang": "Sarjana Terapan",
    "quota": 112,
    "peminat": 852
  },
  {
    "code": "13412055",
    "name": "MANAJEMEN AGRIBISNIS (KAMPUS SUKABUMI)",
    "jenjang": "Sarjana Terapan",
    "quota": 36,
    "peminat": 248
  },
  {
    "code": "13412056",
    "name": "MANAJEMEN INDUSTRI",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 566
  },
  {
    "code": "13412057",
    "name": "ANALISIS KIMIA",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 489
  },
  {
    "code": "13412058",
    "name": "TEKNIK DAN MANAJEMEN LINGKUNGAN",
    "jenjang": "Sarjana Terapan",
    "quota": 56,
    "peminat": 588
  },
  {
    "code": "13412059",
    "name": "AKUNTANSI",
    "jenjang": "Sarjana Terapan",
    "quota": 112,
    "peminat": 1188
  },
  {
    "code": "13412060",
    "name": "PARAMEDIK VETERINER",
    "jenjang": "Sarjana Terapan",
    "quota": 34,
    "peminat": 211
  },
  {
    "code": "13412061",
    "name": "TEKNOLOGI DAN MANAJEMEN PRODUKSI PERKEBUNAN",
    "jenjang": "Sarjana Terapan",
    "quota": 42,
    "peminat": 291
  },
  {
    "code": "13412062",
    "name": "TEKNOLOGI PRODUKSI DAN PENGEMBANGAN MASYARAKAT PERTANIAN",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 265
  },
  {
    "code": "13412073",
    "name": "PEMULIAAN TANAMAN DAN TEKNOLOGI BENIH",
    "jenjang": "Sarjana Terapan",
    "quota": 28,
    "peminat": 0
  }
];

const code = data.map((item, index) => {
  const jenjang = item.jenjang === 'Sarjana' ? 'S1' : 'D4';
  const id = `prodi-ipb-${String(index + 1).padStart(2, '0')}`;
  return `    { id: '${id}', kode_prodi: '${item.code}', nama_prodi: '${item.name}', jenjang: '${jenjang}', pt_name: 'INSTITUT PERTANIAN BOGOR (Negeri)', akreditasi: 'Unggul', status: 'Aktif', peminat: ${item.peminat || 0}, quota: ${item.quota} },`;
}).join('\n');

fs.writeFileSync('scratch/ipb_code.txt', code);
console.log('Done!');
