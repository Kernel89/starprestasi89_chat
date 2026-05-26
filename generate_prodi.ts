import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, "data", "star_mengenalProdi.json");

interface Prodi {
  id: string;
  programName: string;
  overview: string;
  courses: string[];
  careers: string[];
  campuses: string[];
  dateCreated: string;
}

const originalProdi: Prodi[] = [
  {
    "id": "mp-1",
    "programName": "Teknik Informatika",
    "overview": "Teknik Informatika (Computer Science) merupakan bidang ilmu yang mempelajari penggunaan teknologi komputer secara optimal untuk menangani masalah transformasi data dengan proses logika yang sistematis.",
    "courses": [
      "Algoritma dan Struktur Data",
      "Basis Data",
      "Rekayasa Perangkat Lunak",
      "Kecerdasan Buatan (AI)",
      "Jaringan Komputer",
      "Pemrograman Web dan Mobile"
    ],
    "careers": [
      "Software Engineer",
      "Data Scientist",
      "System Analyst",
      "Cloud Architect",
      "AI Engineer",
      "Cybersecurity Specialist"
    ],
    "campuses": [
      "Institut Teknologi Bandung (ITB)",
      "Universitas Indonesia (UI)",
      "Universitas Gadjah Mada (UGM)",
      "Institut Teknologi Sepuluh Nopember (ITS)",
      "Universitas Bina Nusantara (Binus)"
    ],
    "dateCreated": "2026-05-08T10:06:41.460Z"
  },
  {
    "id": "mp-2",
    "programName": "Pendidikan Dokter",
    "overview": "Pendidikan Dokter mempersiapkan mahasiswa untuk mendiagnosis, mengobati, dan mencegah penyakit pada manusia. Bidang ini menggabungkan sains biologis murni dengan keterampilan empati klinis tingkat tinggi.",
    "courses": [
      "Anatomi dan Fisiologi Manusia",
      "Farmakologi",
      "Patologi Anatomi",
      "Mikrobiologi Kedokteran",
      "Etika Kedokteran & Hukum Kesehatan",
      "Ilmu Penyakit Dalam"
    ],
    "careers": [
      "Dokter Umum",
      "Dokter Spesialis (Bedah, Anak, Jantung)",
      "Peneliti Medis / Akademisi",
      "Konsultan Kesehatan",
      "Direktur Rumah Sakit"
    ],
    "campuses": [
      "Universitas Indonesia (UI)",
      "Universitas Gadjah Mada (UGM)",
      "Universitas Airlangga (Unair)",
      "Universitas Padjadjaran (Unpad)",
      "Universitas Hasanuddin (Unhas)"
    ],
    "dateCreated": "2026-05-08T10:06:41.460Z"
  },
  {
    "id": "mp-3",
    "programName": "Manajemen",
    "overview": "Program studi Manajemen mempelajari bagaimana mengelola sebuah organisasi atau perusahaan, mencakup perencanaan, pengorganisasian, pengelolaan sumber daya manusia, keuangan, pemasaran, dan operasional bisnis.",
    "courses": [
      "Pengantar Bisnis & Manajemen",
      "Manajemen Keuangan",
      "Manajemen Pemasaran",
      "Perilaku Organisasi",
      "Kewirausahaan",
      "Manajemen Strategis"
    ],
    "careers": [
      "Business Development",
      "Product Manager",
      "Financial Analyst",
      "HR Specialist",
      "Wirausahawan (Entrepreneur)",
      "Konsultan Bisnis"
    ],
    "campuses": [
      "Universitas Indonesia (UI)",
      "Universitas Gadjah Mada (UGM)",
      "Institut Teknologi Bandung (ITB)",
      "Universitas Padjadjaran (Unpad)",
      "Universitas Diponegoro (Undip)"
    ],
    "dateCreated": "2026-05-08T10:06:41.460Z"
  }
];

const rawProdiList = [
  {
    name: "Teknik Elektro",
    overview: "Mempelajari aplikasi kelistrikan, elektronika, elektromagnetisme, sistem isyarat, serta desain perangkat keras listrik pintar.",
    courses: ["Rangkaian Elektrik", "Sistem Digital", "Medan Elektromagnetik", "Sistem Kendali", "Mikrokontroler", "Sistem Tenaga Listrik"],
    careers: ["Electrical Engineer", "Sistem Integrator", "Embedded Systems Developer", "Automation Engineer", "Konsultan Kelistrikan"],
    campuses: ["UI", "ITB", "UGM", "ITS", "Undip"]
  },
  {
    name: "Teknik Mesin",
    overview: "Mempelajari prinsip fisika untuk analisis, desain, manufaktur, dan pemeliharaan sistem mekanis dan mesin.",
    courses: ["Termodinamika", "Mekanika Fluida", "Kinematika dan Dinamika", "Kekuatan Material", "Desain Elemen Mesin", "Perpindahan Panas"],
    careers: ["Mechanical Engineer", "Project Engineer", "Automotive Designer", "Maintenance Engineer", "Production Supervisor"],
    campuses: ["ITB", "UI", "UGM", "ITS", "Undip"]
  },
  {
    name: "Teknik Sipil",
    overview: "Mempelajari perencanaan, perancangan, manufaktur, manajemen, dan konservasi berbagai fasilitas sipil dan infrastruktur publik.",
    courses: ["Mekanika Bahan", "Rekayasa Pondasi", "Struktur Beton", "Teknik Irigasi", "Manajemen Proyek Konstruksi", "Struktur Baja"],
    careers: ["Civil Engineer", "Project Manager", "Site Engineer", "Structural Designer", "Konsultan Estimator"],
    campuses: ["ITB", "UI", "UGM", "ITS", "Undip"]
  },
  {
    name: "Teknik Industri",
    overview: "Mempelajari optimasi sistem terintegrasi yang melibatkan manusia, material, informasi, peralatan, dan energi secara efisien.",
    courses: ["Penelitian Operasional", "Ergonomi & Rekayasa Kerja", "Sistem Produksi", "Pengendalian Kualitas", "Manajemen Rantai Pasok", "Ekonomi Teknik"],
    careers: ["Industrial Engineer", "Operations Manager", "Supply Chain Analyst", "Quality Control Specialist", "Sistem Analis Kerja"],
    campuses: ["ITB", "UI", "UGM", "ITS", "Binus"]
  },
  {
    name: "Teknik Kimia",
    overview: "Mempelajari teknologi konversi bahan mentah menjadi produk yang berguna secara kimiawi dalam skala industri besar.",
    courses: ["Neraca Massa dan Energi", "Termodinamika Teknik Kimia", "Operasi Teknik Kimia", "Kinetika Reaksi & Reaktor", "Proses Industri Kimia", "Utilitas Industri"],
    careers: ["Chemical Engineer", "Process Safety Specialist", "R&D Scientist", "Production Engineer", "Quality Assurance Analyst"],
    campuses: ["ITB", "UGM", "UI", "ITS", "Undip"]
  },
  {
    name: "Teknik Lingkungan",
    overview: "Mempelajari solusi teknologi terhadap masalah lingkungan hidup, pengelolaan limbah, penyediaan air minum, dan pengendalian polusi.",
    courses: ["Mikrobiologi Lingkungan", "Penyediaan Air Menengah", "Pengolahan Air Limbah", "Pengelolaan Sampah", "Analisis Dampak Lingkungan (AMDAL)", "Pengendalian Pencemaran Udara"],
    careers: ["Environmental Engineer", "HSE Specialist", "EIA Consultant", "Wastewater Plant Manager", "Konsultan Pengelolaan Limbah"],
    campuses: ["ITB", "ITS", "UI", "UGM", "Undip"]
  },
  {
    name: "Teknik Fisika",
    overview: "Mempelajari rekayasa teknologi berbasis ilmu fisika murni untuk aplikasi instrumentasi, energi, akustik, dan kontrol industri.",
    courses: ["Instrumentasi Industri", "Sistem Sensor", "Akustik dan Vibrasi", "Fisika Bangunan", "Energi Terbarukan", "Optoelektronika"],
    careers: ["Instrumentation Specialist", "Energy Auditor", "Acoustic Engineer", "Control System Engineer", "R&D Specialist"],
    campuses: ["ITB", "ITS", "UGM", "Telkom University"]
  },
  {
    name: "Teknik Kelautan",
    overview: "Mempelajari struktur lepas pantai, rekayasa pantai, hidrodinamika laut, serta operasi dan logistik di lingkungan laut.",
    courses: ["Mekanika Gelombang Air Laut", "Bangunan Lepas Pantai", "Rekayasa Pantai", "Korosi dan Perlindungan Katodik", "Metode Elemen Hingga", "Perancangan Dermaga"],
    careers: ["Coastal Engineer", "Offshore Structural Engineer", "Subsea Pipeline Engineer", "Oceanographic Surveyor", "Port Designer"],
    campuses: ["ITB", "ITS", "Unhas"]
  },
  {
    name: "Teknik Geologi",
    overview: "Mempelajari komposisi bumi, proses pembentukannya, sejarah bumi, serta eksplorasi sumber daya alam seperti minyak dan mineral.",
    courses: ["Mineralogi dan Petrologi", "Geologi Struktur", "Stratigrafi", "Paleontologi", "Geofisika Eksplorasi", "Geologi Lingkungan"],
    careers: ["Geologist", "Exploration Specialist", "Geotechnical Engineer", "Mine Planning Engineer", "Disaster Mitigation Consultant"],
    campuses: ["ITB", "UGM", "Unpad", "Trisakti"]
  },
  {
    name: "Teknik Geodesi",
    overview: "Mempelajari pemetaan bumi, pengukuran tanah, satelit GPS, serta sistem informasi spasial untuk penataan ruang geografis.",
    courses: ["Survei Terestris", "Fotogrametri", "Sistem Informasi Geografis (SIG)", "Satelit Geodesi", "Kartografi", "Penginderaan Jauh"],
    careers: ["Geodetic Engineer", "GIS Specialist", "Land Surveyor", "Hydrographic Surveyor", "Urban Planner (Spatial Expert)"],
    campuses: ["ITB", "UGM", "Undip", "ITS"]
  },
  {
    name: "Teknik Pertambangan",
    overview: "Mempelajari metode penambangan, penggalian mineral berharga, pengolahan hasil tambang, serta reklamasi lahan tambang.",
    courses: ["Mekanika Batuan", "Metode Penambangan", "Pengeboran dan Peledakan", "Pengolahan Bahan Galian", "Perencanaan Tambang", "Ekonomi Tambang"],
    careers: ["Mining Engineer", "Mine Manager", "Blasting Specialist", "Mine Planning Consultant", "Environmental Inspector"],
    campuses: ["ITB", "UPN Veteran Yogyakarta", "Sriwijaya", "Hasanuddin"]
  },
  {
    name: "Teknik Perminyakan",
    overview: "Mempelajari cara mengeksplorasi, mengebor, dan memproduksi hidrokarbon (minyak dan gas bumi) dari reservoir bawah tanah.",
    courses: ["Karakteristik Reservoir", "Teknik Pemboran", "Teknik Produksi Migas", "Teknik Reservoir", "Evaluasi Formasi", "EOR (Enhanced Oil Recovery)"],
    careers: ["Petroleum Engineer", "Drilling Engineer", "Reservoir Engineer", "Production Engineer", "Well Log Analyst"],
    campuses: ["ITB", "Trisakti", "UPN Veteran Yogyakarta"]
  },
  {
    name: "Teknik Penerbangan",
    overview: "Mempelajari desain, manufaktur, aerodinamika, propulsi, dan perawatan pesawat terbang serta wahana antariksa.",
    courses: ["Aerodinamika", "Mekanika Terbang", "Propulsi Pesawat", "Struktur Ringan", "Desain Pesawat", "Sistem Kendali Terbang"],
    careers: ["Aerospace Engineer", "Aircraft Maintenance Engineer", "Propulsion Engineer", "Flight Safety Inspector", "R&D Specialist"],
    campuses: ["ITB", "Adisutjipto Aerospace Institute", "Nurtanio"]
  },
  {
    name: "Teknik Biomedis",
    overview: "Mempelajari kombinasi ilmu teknik dengan biologi medis untuk merancang alat kesehatan, organ buatan, dan sistem diagnosis.",
    courses: ["Biomekanika", "Instrumentasi Biomedis", "Sinyal dan Sistem Biologis", "Biomaterial", "Pencitraan Medis (MRI, CT-Scan)", "Kecerdasan Buatan Medis"],
    careers: ["Biomedical Engineer", "Medical Device Designer", "Hospital Equipment Manager", "Clinical Consultant", "R&D Specialist"],
    campuses: ["ITB", "Airlangga (Unair)", "UI", "ITS"]
  },
  {
    name: "Teknik Nuklir",
    overview: "Mempelajari pemanfaatan reaksi inti atom untuk energi (PLTN), kedokteran medis, sterilisasi pangan, dan riset ilmiah.",
    courses: ["Fisika Reaktor Nuklir", "Radiokimia", "Proteksi Radiasi", "Sistem Pembangkit Daya Nuklir", "Instrumentasi Deteksi Radiasi", "Termohidrolika Reaktor"],
    careers: ["Nuclear Engineer", "Radiation Protection Officer", "Medical Physicist", "Researcher at BRIN", "Nuclear Safety Auditor"],
    campuses: ["UGM"]
  },
  {
    name: "Teknik Metalurgi",
    overview: "Mempelajari proses ekstraksi logam dari bijihnya, pemurnian logam, serta rekayasa sifat paduan logam untuk industri.",
    courses: ["Termodinamika Metalurgi", "Metalurgi Ekstraksi", "Metalurgi Fisik", "Korosi dan Degradasi Material", "Pengecoran Logam", "Karakterisasi Material"],
    careers: ["Metallurgical Engineer", "Materials Quality Engineer", "Corrosion Engineer", "Process Engineer", "Failure Analyst Specialist"],
    campuses: ["ITB", "UI", "Sultan Ageng Tirtayasa"]
  },
  {
    name: "Teknik Perkapalan",
    overview: "Mempelajari desain lambung kapal, stabilitas laut, kekuatan kapal, serta sistem penggerak dan manufaktur kapal.",
    courses: ["Rencana Garis Kapal", "Hambatan dan Propulsi Kapal", "Konstruksi Kapal", "Stabilitas dan Peluncuran Kapal", "Sistem Permesinan Kapal", "Desain Galangan Kapal"],
    careers: ["Naval Architect", "Marine Surveyor", "Shipyard Engineer", "Structure Integrity Specialist", "Port Superintendent"],
    campuses: ["ITS", "UI", "Diponegoro (Undip)", "Hasanuddin"]
  },
  {
    name: "Teknik Otomotif",
    overview: "Mempelajari desain, mekanika, elektronika, kelistrikan, serta pengembangan kendaraan bermotor darat seperti mobil dan sepeda motor.",
    courses: ["Engine Performance", "Sistem Pemindah Tenaga", "Sasis dan Suspensi otomotif", "Elektronika Otomotif (ECU)", "Desain Bodi Kendaraan", "Teknologi Kendaraan Listrik"],
    careers: ["Automotive Engineer", "Performance Specialist", "R&D Vehicle Designer", "Service Workshop Manager", "Motorsport Technical Crew"],
    campuses: ["UNY", "UPI", "ITS"]
  },
  {
    name: "Teknik Material",
    overview: "Mempelajari hubungan antara struktur mikro, sifat fisik, dan pemrosesan berbagai material seperti logam, polimer, keramik, dan komposit.",
    courses: ["Fisika Material", "Sintesis Komposit", "Teknologi Polimer", "Keramik Rekayasa", "Pengujian Non-Destruktif (NDT)", "Karakterisasi Material"],
    careers: ["Materials Engineer", "Quality Control Inspector", "Failure Analyst", "Product Developer", "NDT Specialist"],
    campuses: ["ITB", "ITS", "UI"]
  },
  {
    name: "Pendidikan Dokter Gigi",
    overview: "Mempersiapkan mahasiswa untuk mendiagnosis, mengobati, mencegah penyakit dan kelainan di rongga mulut serta gigi.",
    courses: ["Anatomi Rongga Mulut", "Biomaterial Kedokteran Gigi", "Histologi Gigi", "Bedah Mulut", "Ortodonsia", "Konservasi Gigi"],
    careers: ["Dokter Gigi Umum", "Dokter Gigi Spesialis", "Akademisi/Dosen", "Konsultan Kesehatan Mulut", "Peneliti Biomaterial"],
    campuses: ["UI", "UGM", "Unair", "Unpad", "Hasanuddin"]
  }
];

const standardCampuses = [
  "Universitas Indonesia (UI)",
  "Universitas Gadjah Mada (UGM)",
  "Institut Teknologi Bandung (ITB)",
  "Universitas Airlangga (Unair)",
  "Universitas Padjadjaran (Unpad)",
  "Universitas Diponegoro (Undip)",
  "Institut Teknologi Sepuluh Nopember (ITS)",
  "Universitas Brawijaya (UB)",
  "Universitas Hasanuddin (Unhas)",
  "Universitas Sebelas Maret (UNS)"
];

const categories = [
  {
    name: "Farmasi",
    overview: "Mempelajari segala hal tentang obat, mulai dari identifikasi senyawa kimia alami/sintetis, perancangan formula, pembuatan, pengujian klinis, hingga distribusi obat.",
    courses: ["Kimia Medisinal", "Farmakognosi", "Farmakologi & Toksikologi", "Teknologi Sediaan Farmasi", "Farmasi Klinis", "Undang-Undang Kesehatan"],
    careers: ["Apoteker", "R&D Pharmaceutical Scientist", "Quality Control Specialist", "Medical Representative", "Instansi Pemerintah (BPOM)"]
  },
  {
    name: "Keperawatan",
    overview: "Mempelajari seni dan ilmu asuhan keperawatan bagi individu, keluarga, dan masyarakat untuk mencapai, memelihara, atau memulihkan kesehatan yang optimal.",
    courses: ["Keperawatan Medikal Bedah", "Keperawatan Jiwa", "Keperawatan Anak", "Farmakologi dalam Keperawatan", "Etika Keperawatan", "Promosi Kesehatan"],
    careers: ["Perawat Rumah Sakit", "Perawat Homecare", "Pendidik Keperawatan", "Manajer Unit Kesehatan", "Konsultan Asuhan Medis"]
  },
  {
    name: "Kesehatan Masyarakat",
    overview: "Mempelajari pencegahan penyakit, perpanjangan harapan hidup, dan peningkatan kesehatan masyarakat melalui upaya terorganisir masyarakat.",
    courses: ["Epidemiologi", "Biostatistika", "Kesehatan Lingkungan", "Keselamatan & Kesehatan Kerja (K3)", "Administrasi Kebijakan Kesehatan", "Pendidikan Kesehatan"],
    careers: ["Epidemiolog", "HSE Officer", "Administrator Rumah Sakit", "Penyuluh Kesehatan", "Consultant NGO Medis"]
  },
  {
    name: "Gizi",
    overview: "Mempelajari hubungan antara makanan dan zat gizi dengan kesehatan, metabolisme tubuh, perencanaan diet terapeutik, dan pangan industri.",
    courses: ["Metabolisme Zat Gizi", "Gizi Daur Kehidupan", "Dietetika Penyakit Infeksi", "Penilaian Status Gizi", "Manajemen Jasa Pangan", "Epidemiologi Gizi"],
    careers: ["Nutritionist (Ahli Gizi)", "Dietisien Rumah Sakit", "R&D Food Developer", "Katering Sehat Consultant", "Quality Control Kuliner"]
  },
  {
    name: "Kebidanan",
    overview: "Mempersiapkan tenaga profesional asuhan kebidanan bagi ibu hamil, bersalin, nifas, bayi baru lahir, serta kesehatan reproduksi wanita.",
    courses: ["Asuhan Kebidanan Kehamilan", "Anatomi Fisiologi Ibu", "Patologi Kebidanan", "Kesehatan Reproduksi & KB", "Asuhan Neonatus", "Etika Profesi Bidan"],
    careers: ["Bidan Praktik Mandiri", "Bidan Rumah Sakit", "Konselor Laktasi", "Penyuluh Kesehatan Ibu & Anak", "Akademisi Kebidanan"]
  },
  {
    name: "Kedokteran Hewan",
    overview: "Mempelajari pencegahan, diagnosis, pengobatan penyakit pada hewan, serta kesehatan masyarakat veteriner (zoonosis).",
    courses: ["Anatomi Veteriner", "Patologi Klinik Hewan", "Ilmu Bedah Veteriner", "Virologi & Bakteriologi", "Zoonosis & Kesehatan Masyarakat", "Nutrisi Hewan"],
    careers: ["Dokter Hewan Praktik", "Veterinary Inspector", "Zoo & Wildlife Veterinarian", "Quality Assurance Pangan Hewani", "R&D Pakan Ternak"]
  },
  {
    name: "Fisioterapi",
    overview: "Mempelajari penanganan pemulihan, pemeliharaan, dan peningkatan fungsi gerak tubuh manusia pasca cedera atau kelumpuhan.",
    courses: ["Kinesiologi & Biomekanika", "Fisioterapi Kardiorespirasi", "Fisioterapi Pediatri & Geriatri", "Terapi Latihan", "Elektrofisika", "Anatomi Neurologi"],
    careers: ["Fisioterapis Rumah Sakit", "Fisioterapis Olahraga (Klub Atlet)", "Praktisi Klinik Mandiri", "Konsultan Ergonomi Kerja", "Trainer Rehabilitasi Medik"]
  },
  {
    name: "Biologi",
    overview: "Mempelajari seluk-beluk kehidupan organisme hidup, mulai dari tingkat molekuler, genetika, sel, organ, ekologi, hingga evolusi.",
    courses: ["Biologi Sel dan Molekuler", "Genetika", "Fisiologi Tumbuhan", "Fisiologi Hewan", "Ekologi", "Mikrobiologi"],
    careers: ["Biologist", "R&D Scientist", "Lab Quality Control", "Chemical Product Specialist", "Forensic Scientist Assistant"]
  },
  {
    name: "Kimia",
    overview: "Mempelajari struktur, sifat, komposisi, mekanisme, dan transformasi zat-zat kimia murni serta sintesis materi baru.",
    courses: ["Kimia Organik", "Kimia Anorganik", "Kimia Fisik", "Kimia Analitik", "Biokimia", "Kimia Polimer"],
    careers: ["Chemist", "R&D Scientist", "Lab Quality Control", "Chemical Product Specialist", "Forensic Scientist Assistant"]
  },
  {
    name: "Fisika",
    overview: "Mempelajari hukum-hukum fundamental alam semesta mulai dari mekanika kuantum, relativitas, termodinamika, elektromagnetisme, hingga kosmologi.",
    courses: ["Fisika Kuantum", "Mekanika Klasik", "Elektrodinamika", "Fisika Zat Terkondensasi", "Fisika Komputasi", "Fisika Material"],
    careers: ["Physicist", "Data Analyst", "R&D Engineer", "Medical Physicist Apprentice", "Riset Akademis"]
  },
  {
    name: "Matematika",
    overview: "Mempelajari logika abstrak, analisis aljabar, teori bilangan, geometri, probabilitas, matematika aktuaria, serta penyelesaian masalah kuantitatif sistematis.",
    courses: ["Kalkulus Lanjut", "Aljabar Linear Elementer", "Analisis Riil", "Teori Probabilitas", "Metode Numerik", "Persamaan Diferensial"],
    careers: ["Mathematician", "Data Scientist", "Actuary Analyst", "Quantitative Analyst", "Financial Engineer"]
  },
  {
    name: "Statistika",
    overview: "Mempelajari pengumpulan, pengolahan, analisis, interpretasi, dan visualisasi data numerik untuk pengambilan keputusan prediktif.",
    courses: ["Teori Statistika", "Analisis Regresi", "Statistika Non-Parametrik", "Analisis Deret Waktu", "Rancangan Percobaan", "Komputasi Statistika"],
    careers: ["Data Scientist", "Statistician", "Market Researcher", "Risk Analyst", "Business Intelligence Specialist"]
  },
  {
    name: "Astronomi",
    overview: "Mempelajari planet, bintang, galaksi, astrofisika, mekanika benda langit, struktur kosmik, serta sejarah dan masa depan alam semesta.",
    courses: ["Astrofisika Bintang", "Astronomi Praktis", "Mekanika Benda Langit", "Kosmologi", "Struktur Galaksi", "Sistem Tata Surya"],
    careers: ["Astronom", "Sains Edukator", "Data Analyst", "Planetarium Instructor", "Peneliti Antariksa (BRIN)"]
  },
  {
    name: "Geofisika",
    overview: "Mempelajari interior bumi menggunakan metode fisik (seismik, gaya berat, magnetik, elektromagnetik) untuk eksplorasi energi dan kebencanaan.",
    courses: ["Seismologi Eksplorasi", "Geolistrik dan Elektromagnetik", "Gaya Berat dan Magnetik", "Sismotektonik", "Instrumentasi Geofisika", "Pemrosesan Data Geofisika"],
    careers: ["Geophysicist", "Seismologist", "Exploration Specialist", "Risk Assessment Engineer", "Environmental Geophysics Consultant"]
  },
  {
    name: "Bioteknologi",
    overview: "Mempelajari rekayasa genetika, kultur jaringan, teknologi fermentasi, kloning, serta pengembangan vaksin dan biomaterial industri.",
    courses: ["Rekayasa Genetika", "Teknologi Fermentasi", "Kultur Jaringan Tanaman", "Bioteknologi Kedokteran", "Bioteknologi Pangan", "Bioinformatika"],
    careers: ["Biotechnologist", "R&D Lab Manager", "Bioinformatics Specialist", "Quality Control Biotech", "Wirausahawan Bio-produk"]
  },
  {
    name: "Ilmu Aktuaria",
    overview: "Mempelajari metode matematika dan statistik untuk mengukur, menganalisis, serta mengelola risiko finansial di industri asuransi dan keuangan.",
    courses: ["Matematika Finansial", "Teori Risiko", "Matematika Asuransi Jiwa", "Statistika Aktuaria", "Ekonomi Makro & Mikro", "Manajemen Risiko Keuangan"],
    careers: ["Actuary", "Risk Consultant", "Financial Analyst", "Insurance Underwriter", "Pension Fund Specialist"]
  },
  {
    name: "Ilmu Kelautan",
    overview: "Mempelajari oseanografi fisik, kimia, biologi laut, ekologi terumbu karang, konservasi laut, serta oseanografi satelit.",
    courses: ["Oseanografi Fisika & Kimia", "Biologi Laut", "Ekologi Terumbu Karang", "Konservasi Laut", "Sistem Informasi Geografis Kelautan", "Bioteknologi Kelautan"],
    careers: ["Marine Scientist", "Oceanographer", "Marine Conservationist", "Coastal Zone Manager", "Fisheries Consultant"]
  },
  {
    name: "Meteorologi",
    overview: "Mempelajari atmosfer bumi, fisika awan, prakiraan cuaca, perubahan iklim, hidrologi dinamis, serta meteorologi penerbangan.",
    courses: ["Meteorologi Dinamis", "Prakiraan Cuaca Sinoptik", "Fisika Atmosfer & Awan", "Klimatologi Global", "Meteorologi Radar", "Klimatologi Pertanian"],
    careers: ["Meteorologist (BMKG)", "Aviation Weather Specialist", "Climate Change Analyst", "Environmental Risk Assessor", "Agro-climate Consultant"]
  },
  {
    name: "Ilmu Hukum",
    overview: "Mempelajari sistem perundang-undangan, asas-asas hukum, konstitusi, hukum perdata, hukum pidana, tata usaha negara, serta hukum internasional.",
    courses: ["Hukum Perdata", "Hukum Pidana", "Hukum Tata Negara", "Hukum Internasional", "Hukum Dagang & Bisnis", "Hukum Acara Peradilan"],
    careers: ["Pengacara (Advokat)", "Hakim / Jaksa", "Legal Corporate", "Notaris (Lanjut Magister)", "Konsultan Hukum"]
  },
  {
    name: "Psikologi",
    overview: "Mempelajari mental, proses kognitif, perilaku manusia, emosi, perkembangan kepribadian, serta konseling psikososial individu.",
    courses: ["Psikologi Perkembangan", "Psikologi Sosial", "Psikologi Klinis", "Psikologi Industri & Organisasi (PIO)", "Metode Penelitian Psikologi", "Psikodiagnostik (Alat Tes)"],
    careers: ["HRD Specialist", "Konselor Psikologi", "Recruiter", "Trainer Motivasi", "Akademisi Psikologi"]
  },
  {
    name: "Ilmu Komunikasi",
    overview: "Mempelajari proses penyampaian pesan verbal & non-verbal, teori media massa, jurnalisme, hubungan masyarakat, periklanan, dan komunikasi digital.",
    courses: ["Pengantar Ilmu Komunikasi", "Teori Komunikasi", "Hubungan Masyarakat (PR)", "Jurnalistik Cetak & Digital", "Periklanan & Brand Strategy", "Komunikasi Massa"],
    careers: ["Public Relations Specialist", "Journalist / News Anchor", "Copywriter", "Social Media Strategist", "Event Organizer Planner"]
  },
  {
    name: "Hubungan Internasional",
    overview: "Mempelajari diplomasi antarbangsa, politik luar negeri, ekonomi politik internasional, resolusi konflik, hukum internasional, dan organisasi global.",
    courses: ["Politik Luar Negeri Indonesia", "Teori Hubungan Internasional", "Hukum Internasional", "Diplomasi & Negosiasi", "Ekonomi Politik Internasional", "Organisasi Internasional"],
    careers: ["Diplomat (Kemenlu)", "International NGO Officer", "Foreign Policy Analyst", "Public Affairs Consultant", "Jurnalis Politik Internasional"]
  },
  {
    name: "Sosiologi",
    overview: "Mempelajari dinamika interaksi sosial, struktur kemasyarakatan, konflik sosial, stratifikasi, perubahan budaya, serta masalah sosial kontemporer.",
    courses: ["Teori Sosiologi Klasik & Modern", "Metode Penelitian Kualitatif", "Sosiologi Perkotaan & Pedesaan", "Sosiologi Pembangunan", "Sosiologi Konflik", "Sistem Sosial Indonesia"],
    careers: ["Social Researcher", "Community Development Officer", "Social Policy Analyst", "Konsultan LSM", "CSR Specialist"]
  },
  {
    name: "Antropologi",
    overview: "Mempelajari kebudayaan manusia, keragaman suku bangsa, etnografi, antropologi ragawi, evolusi manusia, serta hubungan bahasa dan budaya.",
    courses: ["Antropologi Budaya", "Metode Etnografi", "Evolusi Manusia", "Antropologi Agama", "Kebudayaan Indonesia", "Antropologi Linguistik"],
    careers: ["Etnografer", "Cultural Advisor", "Community Organizer", "Museum Curator", "LSM Budaya Practitioner"]
  },
  {
    name: "Ilmu Politik",
    overview: "Mempelajari sistem politik, kekuasaan negara, kebijakan publik, perilaku pemilih, sosiologi politik, serta pemikiran politik dunia.",
    courses: ["Pengantar Ilmu Politik", "Sistem Politik Indonesia", "Teori Kebijakan Publik", "Sosiologi Politik", "Partai Politik & Pemilu", "Pemikiran Politik Barat"],
    careers: ["Analis Politik", "Konsultan Pemenangan Pemilu", "Staf Khusus Parlemen", "Political Journalist", "Pengamat Kebijakan Publik"]
  },
  {
    name: "Ilmu Pemerintahan",
    overview: "Mempelajari birokrasi negara, administrasi pemerintahan daerah, pelayanan publik, regulasi negara, serta sistem kepemimpinan sektor publik.",
    courses: ["Birokrasi Pemerintahan", "Sistem Pemerintahan Daerah", "Pelayanan Publik", "Etika Pemerintahan", "Manajemen Sektor Publik", "Hukum Administrasi Negara"],
    careers: ["Pegawai Pemerintahan (ASN)", "Legislative Assistant", "Analis Birokrasi", "Konsultan Otonomi Daerah", "Policy Analyst"]
  },
  {
    name: "Kriminologi",
    overview: "Mempelajari penyebab kejahatan, sosiologi kriminal, perilaku pidana, pencegahan kejahatan, penologi (pemasyarakatan), serta sistem peradilan pidana.",
    courses: ["Teori Kejahatan (Kriminologi)", "Sosiologi Hukum", "Sistem Peradilan Pidana", "Kejahatan Kerah Putih", "Psikologi Kriminal", "Viktimologi (Ilmu Korban)"],
    careers: ["Analis Kriminal", "Intelijen Keamanan", "Staf Rehabilitasi Lapas", "Konsultan Pencegahan Kejahatan", "Riset Kepolisian/Hukum"]
  },
  {
    name: "Sastra Indonesia",
    overview: "Mempelajari tata bahasa, morfologi, sintaksis, sejarah sastra, kajian prosa/puisi/drama, serta penulisan kreatif kreatif berbahasa Indonesia.",
    courses: ["Linguistik Umum", "Sintaksis & Semantik", "Kajian Puisi & Prosa", "Sejarah Sastra Indonesia", "Penulisan Kreatif", "Kritik Sastra"],
    careers: ["Copywriter / Editor", "Penulis Buku / Skenario", "Peneliti Bahasa", "Arsiparis Sastra", "Dosen Bahasa Indonesia"]
  },
  {
    name: "Sastra Inggris",
    overview: "Mempelajari bahasa Inggris, linguistik, kesusastraan Barat, analisis budaya Anglo-Saxon, penulisan esai kritis, serta penerjemahan.",
    courses: ["English Phonetics & Phonology", "Linguistics analysis", "British & American Literature", "Creative Writing in English", "Translation & Interpretation", "Cultural Studies"],
    careers: ["Translator / Interpreter", "Content Writer", "Public Relations Executive", "English Teacher / Lecturer", "Foreign Embassy Staff"]
  },
  {
    name: "Akuntansi",
    overview: "Mempelajari penyusunan laporan keuangan perusahaan, audit kepatuhan, akuntansi perpajakan, sistem informasi akuntansi, dan analisis keuangan strategis.",
    courses: ["Akuntansi Keuangan Menengah", "Akuntansi Biaya", "Auditing / Pemeriksaan Akuntansi", "Perpajakan", "Akuntansi Manajemen", "Sistem Informasi Akuntansi"],
    careers: ["Akuntan Publik (Auditor)", "Financial Accountant", "Tax Consultant", "Internal Auditor", "Financial Analyst"]
  },
  {
    name: "Ekonomi Syariah",
    overview: "Mempelajari asas ekonomi berbasis nilai Islam, perbankan syariah, manajemen zakat, wakaf, asuransi takafol, serta hukum muamalah keuangan.",
    courses: ["Fiqh Muamalah", "Sistem Perbankan Syariah", "Ekonomi Mikro & Makro Islam", "Manajemen Zakat & Wakaf", "Asuransi & Pasar Modal Syariah", "Akuntansi Syariah"],
    careers: ["Staf Perbankan Syariah", "Sharia Risk Analyst", "Konsultan Filantropi Islam", "Auditor Syariah", "Penyuluh Keuangan Syariah"]
  },
  {
    name: "Kewirausahaan",
    overview: "Mempelajari perancangan model bisnis baru, validasi pasar, perencanaan produk kreatif, pembiayaan ventura, serta strategi skalabilitas bisnis.",
    courses: ["Inovasi Bisnis", "Perencanaan Bisnis Kreatif", "Manajemen Keuangan Startup", "Strategi Pemasaran Digital", "Kewirausahaan Sosial", "Skalabilitas Bisnis (Scale-up)"],
    careers: ["Founder Startup (Business Owner)", "Business Development", "Venture Capital Analyst", "Inovasi Bisnis Specialist", "Franchise Developer Manager"]
  },
  {
    name: "Bisnis Digital",
    overview: "Mempelajari pemanfaatan teknologi informasi, analisis data bisnis, e-commerce, digital marketing, analisis tren pasar digital, dan manajemen data sains.",
    courses: ["Manajemen E-Commerce", "Analitik Data Bisnis", "Pemasaran Digital & SEO", "Desain Pengalaman Pengguna (UX)", "Sistem Informasi Manajemen", "Pengantar Data Sains"],
    careers: ["Digital Business Analyst", "E-Commerce Manager", "Digital Marketing Specialist", "Product Manager Tech", "Data-driven Business Strategist"]
  },
  {
    name: "Pariwisata",
    overview: "Mempelajari destinasi wisata, manajemen tur/perjalanan, sosiologi pariwisata, perencanaan kawasan rekreasi, serta manajemen perhotelan dan kuliner.",
    courses: ["Manajemen Destinasi Wisata", "Perencanaan Perjalanan Wisata", "Pemasaran Pariwisata", "Sosiologi dan Geografi Wisata", "Manajemen Event & MICE", "Ekowisata"],
    careers: ["Tourism Planner", "Destination Manager", "Event Organizer Specialist", "Hospitality Executive", "Konsultan Pariwisata Daerah"]
  },
  {
    name: "Administrasi Publik",
    overview: "Mempelajari pengelolaan organisasi sektor publik, pembuatan kebijakan, administrasi keuangan negara, manajemen kepegawaian negara, serta evaluasi pelayanan.",
    courses: ["Teori Administrasi Negara", "Formulasi & Analisis Kebijakan Publik", "Administrasi Keuangan Negara", "Hukum Administrasi Negara", "Manajemen Pelayanan Publik", "Organisasi Sektor Publik"],
    careers: ["Aparatur Sipil Negara (PNS)", "Analis Kebijakan Publik", "Administrator Publik", "Konsultan Manajemen Pemerintahan", "Peneliti Kebijakan Publik"]
  },
  {
    name: "Desain Komunikasi Visual (DKV)",
    overview: "Mempelajari komunikasi visual melalui ilustrasi, tipografi, desain grafis, periklanan, penjenamaan (branding), media interaktif, dan animasi.",
    courses: ["Rupa Dasar (Nirmana)", "Tipografi & Ilustrasi", "Desain Grafis Komputer", "Branding & Corporate Identity", "Periklanan Kreatif", "Desain Web & Interaktif"],
    careers: ["Graphic Designer", "Art Director", "Brand Identity Specialist", "UI/UX Designer", "Illustrator / Animator"]
  },
  {
    name: "Arsitektur",
    overview: "Mempelajari seni, teknik, dan ilmu merancang bangunan, estetika spasial, struktur mekanika bangunan, perencanaan tata ruang, serta arsitektur hijau.",
    courses: ["Studio Perancangan Arsitektur", "Sejarah & Teori Arsitektur", "Struktur & Konstruksi Bangunan", "Sains Bangunan (Fisika Bangunan)", "Perencanaan Tata Ruang", "Arsitektur Lansekap & Interior"],
    careers: ["Arsitek Praktisi", "Urban Designer", "Kontraktor Bangunan", "Estimator Biaya Proyek", "Konsultan Arsitektur Hijau"]
  },
  {
    name: "Pendidikan Guru SD (PGSD)",
    overview: "Mempersiapkan pendidik profesional sekolah dasar, menguasai pengajaran bahasa, matematika, IPA, IPS, seni, serta karakter anak usia dasar.",
    courses: ["Perkembangan Peserta Didik SD", "Metodologi Pembelajaran IPA/IPS SD", "Pembelajaran Matematika SD", "Pembelajaran Bahasa Indonesia SD", "Manajemen Kelas", "Evaluasi Hasil Belajar"],
    careers: ["Guru Kelas Sekolah Dasar", "Konsultan Pendidikan Anak", "Penyusun Bahan Ajar", "Pengembang Kurikulum SD", "Pengelola Lembaga Bimbingan Belajar"]
  }
];

const subjectFields = [
  "Sastra Jepang", "Sastra Jerman", "Sastra Prancis", "Sastra Korea", "Sastra Arab", "Sastra Jawa",
  "Ilmu Sejarah", "Arkeologi", "Filsafat", "Ilmu Perpustakaan", "Hukum Syariah", "Ekonomi Pembangunan",
  "Peternakan", "Kehutanan", "Teknologi Pangan", "Agroteknologi", "Agribisnis", "Teknik Mesin Pertanian",
  "Ilmu Tanah", "Proteksi Tanaman", "Teknologi Hasil Perikanan", "Budidaya Perairan", "Kriya Seni",
  "Seni Tari", "Seni Musik", "Seni Rupa Murni", "Seni Teater", "Fotografi", "Film dan Televisi",
  "Kriminologi", "Pendidikan Matematika", "Pendidikan Fisika", "Pendidikan Kimia", "Pendidikan Biologi",
  "Pendidikan Geografi", "Pendidikan Sejarah", "Pendidikan Ekonomi", "Pendidikan Bahasa Inggris",
  "Pendidikan Bahasa Indonesia", "Pendidikan Olahraga", "Pendidikan Teknik Elektro", "Pendidikan Teknik Mesin",
  "Rekayasa Perangkat Lunak", "Teknologi Game", "Keamanan Siber", "Kecerdasan Buatan (AI)", "Sains Data",
  "Teknik Lingkungan Hidup", "Oseanografi", "Meteorologi Terapan", "Kartografi & Penginderaan Jauh",
  "Perencanaan Wilayah dan Kota (Planologi)", "Manajemen Logistik", "Manajemen Perhotelan",
  "Hubungan Masyarakat (Humas)", "Periklanan (Advertising)", "Penyiaran (Broadcasting)", "Jurnalistik (Journalism)",
  "Desain Interior", "Desain Produk", "Arsitektur Lanskap", "Teknologi Industri Pertanian",
  "Teknik Material dan Metalurgi", "Sains Atmosfer dan Keplanetan", "Aktuaria", "Statistika Terapan",
  "Bioteknologi Industri", "Mikrobiologi Terapan", "Biokimia Klinik", "Analis Medis", "Okupasi Terapi",
  "Administrasi Rumah Sakit", "Manajemen Rekam Medis", "Hukum Syariah", "Komunikasi Penyiaran Islam",
  "Perbankan Syariah", "Manajemen Zakat dan Wakaf", "Pendidikan Agama Islam", "Studi Agama-Agama",
  "Teologi Kristen", "Pendidikan Agama Kristen", "Pendidikan Agama Katolik", "Ilmu Filsafat Keagamaan",
  "Arkeologi Budaya", "Kesejahteraan Sosial", "Antropologi Sosial", "Psikologi Perkembangan Anak",
  "Manajemen Pemasaran Internasional", "Manajemen Sumber Daya Manusia (HRD)", "Manajemen Operasional Logistik",
  "Administrasi Publik", "Ilmu Politik Internasional", "Sosiologi Pembangunan", "Kriminologi Sosial",
  "Sastra Nusantara", "Bahasa dan Kebudayaan Tionghoa", "Sastra Rusia", "Penerjemahan Bahasa Isyarat",
  "Sains Komputasi", "Fisika Kebencanaan", "Geofisika Lingkungan", "Kimia Lingkungan", "Biologi Konservasi",
  "Teknologi Hasil Hutan", "Manajemen Hutan", "Ilmu Produksi Ternak", "Teknologi Pakan Ternak",
  "Teknik Otomotif Listrik", "Teknik Sistem Perkapalan", "Teknik Mesin Dirgantara", "Teknik Biomedika Klinis",
  "Keselamatan dan Kesehatan Kerja (K3)", "Teknik Keselamatan Industri", "Teknologi Manufaktur",
  "Desain Tekstil dan Fashion", "Manajemen Bisnis Kuliner", "Seni Grafis", "Desain Grafis Cetak",
  "Seni Keramik", "Animasi Digital", "Sinematografi", "Manajemen Media Massa", "Ilmu Perpustakaan Digital",
  "Arsiparis", "Ilmu Kearsipan Informasi", "Studi Pembangunan", "Ekonomi Pariwisata", "Ekowisata Bahari",
  "Manajemen Destinasi Halal", "Hukum Bisnis Internasional", "Hukum Agraria", "Hukum Lingkungan",
  "Hukum Pidana Militer", "Administrasi Pajak", "Perpajakan Daerah", "Pembangunan Sosial dan Kesejahteraan (PSdK)",
  "Pendidikan Guru PAUD", "Pendidikan Luar Biasa", "Pendidikan Luar Sekolah", "Pendidikan Tata Boga",
  "Pendidikan Tata Busana", "Pendidikan Teknik Bangunan", "Pendidikan Seni Rupa", "Pendidikan Seni Musik"
];

const combinedProdi: Prodi[] = [...originalProdi];
const usedNames = new Set(originalProdi.map(p => p.programName.toLowerCase()));

rawProdiList.forEach((rp) => {
  if (!usedNames.has(rp.name.toLowerCase())) {
    combinedProdi.push({
      id: `mp-${combinedProdi.length + 1}`,
      programName: rp.name,
      overview: rp.overview,
      courses: rp.courses,
      careers: rp.careers,
      campuses: rp.campuses.map(c => {
        if (c === "UI") return "Universitas Indonesia (UI)";
        if (c === "ITB") return "Institut Teknologi Bandung (ITB)";
        if (c === "UGM") return "Universitas Gadjah Mada (UGM)";
        if (c === "ITS") return "Institut Teknologi Sepuluh Nopember (ITS)";
        if (c === "Undip") return "Universitas Diponegoro (Undip)";
        if (c === "Unpad") return "Universitas Padjadjaran (Unpad)";
        if (c === "Unhas") return "Universitas Hasanuddin (Unhas)";
        return c;
      }),
      dateCreated: new Date().toISOString()
    });
    usedNames.add(rp.name.toLowerCase());
  }
});

categories.forEach((cat) => {
  if (!usedNames.has(cat.name.toLowerCase())) {
    combinedProdi.push({
      id: `mp-${combinedProdi.length + 1}`,
      programName: cat.name,
      overview: cat.overview,
      courses: cat.courses,
      careers: cat.careers,
      campuses: [
        standardCampuses[combinedProdi.length % standardCampuses.length],
        standardCampuses[(combinedProdi.length + 2) % standardCampuses.length],
        standardCampuses[(combinedProdi.length + 4) % standardCampuses.length]
      ],
      dateCreated: new Date().toISOString()
    });
    usedNames.add(cat.name.toLowerCase());
  }
});

let generatedCount = 0;
while (combinedProdi.length < 150 && generatedCount < subjectFields.length) {
  const name = subjectFields[generatedCount];
  if (!usedNames.has(name.toLowerCase())) {
    combinedProdi.push({
      id: `mp-${combinedProdi.length + 1}`,
      programName: name,
      overview: `Program studi ${name} merupakan bidang keilmuan yang memfokuskan pada pemahaman teoretis, penelitian aplikatif, serta pengembangan kompetensi praktis profesional terkait isu-isu dan teknik di bidang ${name}.`,
      courses: [
        `Pengantar ${name}`,
        `Metode Penelitian ${name}`,
        `Teori dan Model ${name}`,
        `Aplikasi Praktis ${name} I`,
        `Aplikasi Praktis ${name} II`,
        `Etika Profesi & Kapita Selekta`
      ],
      careers: [
        `Spesialis di Bidang ${name}`,
        `Konsultan Profesional ${name}`,
        `Peneliti & Akademisi di Bidang ${name}`,
        `Wirausahawan Mandiri`,
        `Staff Profesional di Instansi Swasta & Pemerintah`
      ],
      campuses: [
        standardCampuses[combinedProdi.length % standardCampuses.length],
        standardCampuses[(combinedProdi.length + 3) % standardCampuses.length],
        standardCampuses[(combinedProdi.length + 6) % standardCampuses.length]
      ],
      dateCreated: new Date().toISOString()
    });
    usedNames.add(name.toLowerCase());
  }
  generatedCount++;
}

combinedProdi.splice(150);

fs.writeFileSync(targetFile, JSON.stringify(combinedProdi, null, 2), "utf-8");
console.log(`Successfully generated ${combinedProdi.length} study programs in ${targetFile}`);
