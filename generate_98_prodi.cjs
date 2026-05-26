const fs = require('fs');

const markdown = fs.readFileSync('C:/Users/asusc/.gemini/antigravity/brain/d7f60250-547d-4232-9db4-39fbfbe0e95f/belum_ada_di_mengenal_prodi.md', 'utf8');

// Parse the missing study programs
const prodiList = [];
const lines = markdown.split('\n');
for (const line of lines) {
    if (line.startsWith('- ')) {
        prodiList.push(line.replace('- ', '').trim());
    }
}

console.log(`Found ${prodiList.length} prodi to generate.`);

const generateData = (name, index) => {
    let lowerName = name.toLowerCase();
    
    // Default / Fallback
    let overview = `Program studi ${name} mempelajari ilmu, teori, dan praktik terkait bidang ini secara komprehensif. Mahasiswa akan dilatih untuk memiliki kemampuan analitis, manajerial, dan teknis yang dibutuhkan di dunia kerja modern.`;
    let courses = ["Pengantar Ilmu Dasar", "Metodologi Penelitian", "Manajemen Proyek", "Etika Profesi", "Seminar Nasional", "Tugas Akhir/Skripsi"];
    let careers = ["Spesialis di Bidang Terkait", "Konsultan Independen", "Akademisi/Dosen", "Pegawai Negeri Sipil (PNS)", "Peneliti", "Pengusaha"];
    let campuses = ["Universitas Gadjah Mada (UGM)", "Universitas Indonesia (UI)", "Universitas Brawijaya (UB)", "Universitas Diponegoro (Undip)", "Universitas Hasanuddin (Unhas)"];
    
    // Keyword Matching
    if (lowerName.includes("pendidikan") || lowerName.includes("guru")) {
        overview = `Program studi ${name} mencetak tenaga pendidik yang profesional dan kompeten di bidangnya. Lulusannya dipersiapkan untuk menjadi pengajar yang inovatif serta memahami perkembangan psikologi peserta didik dan kurikulum modern.`;
        courses = ["Psikologi Pendidikan", "Strategi Pembelajaran", "Evaluasi Pendidikan", "Perkembangan Peserta Didik", "Microteaching", "Manajemen Pendidikan"];
        careers = ["Guru/Pendidik", "Dosen", "Peneliti Pendidikan", "Konsultan Kurikulum", "Kepala Sekolah/Manajemen Sekolah", "Instruktur Pelatihan"];
        campuses = ["Universitas Pendidikan Indonesia (UPI)", "Universitas Negeri Yogyakarta (UNY)", "Universitas Negeri Malang (UM)", "Universitas Negeri Jakarta (UNJ)", "Universitas Negeri Semarang (UNNES)"];
    } else if (lowerName.includes("teknik") || lowerName.includes("teknologi") || lowerName.includes("sains") || lowerName.includes("informatika")) {
        overview = `Program studi ${name} fokus pada penerapan ilmu sains dan matematika untuk merancang, memelihara, dan menyelesaikan masalah teknis yang ada di masyarakat. Mahasiswa akan dilatih untuk berpikir logis dan menciptakan solusi berbasis rekayasa teknologi.`;
        courses = ["Matematika Rekayasa", "Fisika Dasar", "Algoritma dan Pemrograman", "Mekanika Teknik", "Sistem Informasi", "Rekayasa Desain"];
        careers = ["Insinyur (Engineer)", "Konsultan Teknik", "Analis Sistem", "Peneliti Teknologi", "Manajer Proyek IT/Teknik", "Spesialis R&D"];
        campuses = ["Institut Teknologi Bandung (ITB)", "Institut Teknologi Sepuluh Nopember (ITS)", "Universitas Gadjah Mada (UGM)", "Universitas Indonesia (UI)", "Telkom University"];
    } else if (lowerName.includes("kedokteran") || lowerName.includes("gigi") || lowerName.includes("hewan") || lowerName.includes("keperawatan") || lowerName.includes("kesehatan") || lowerName.includes("gizi") || lowerName.includes("kebidanan") || lowerName.includes("farmasi")) {
        overview = `Program studi ${name} dirancang untuk mencetak tenaga medis dan profesional kesehatan yang tanggap, berempati, dan memiliki kapabilitas klinis yang mumpuni. Kurikulum meliputi teori dasar medis hingga praktik klinis di fasilitas kesehatan.`;
        courses = ["Anatomi Fisiologi", "Biokimia Kedokteran", "Etika dan Hukum Kesehatan", "Patologi", "Farmakologi Dasar", "Keterampilan Klinis (Skill Lab)"];
        careers = ["Dokter/Tenaga Medis", "Perawat Klinis", "Ahli Gizi/Dietisien", "Peneliti Medis", "Manajer Rumah Sakit", "Konsultan Kesehatan"];
        campuses = ["Universitas Indonesia (UI)", "Universitas Airlangga (Unair)", "Universitas Gadjah Mada (UGM)", "Universitas Padjadjaran (Unpad)", "Universitas Diponegoro (Undip)"];
    } else if (lowerName.includes("manajemen") || lowerName.includes("akuntansi") || lowerName.includes("ekonomi") || lowerName.includes("bisnis") || lowerName.includes("administrasi")) {
        overview = `Program studi ${name} membekali mahasiswa dengan kemampuan untuk mengelola sumber daya, merencanakan strategi finansial, dan mengorganisir operasional suatu instansi atau perusahaan agar efektif dan efisien.`;
        courses = ["Pengantar Manajemen", "Akuntansi Dasar", "Ekonomi Makro & Mikro", "Manajemen Keuangan", "Perilaku Organisasi", "Hukum Bisnis"];
        careers = ["Manajer Perusahaan", "Akuntan", "Analis Keuangan", "Konsultan Bisnis", "Pengusaha (Entrepreneur)", "PNS - Kemenkeu/Pemda"];
        campuses = ["Universitas Indonesia (UI)", "Universitas Gadjah Mada (UGM)", "Universitas Brawijaya (UB)", "Universitas Airlangga (Unair)", "Universitas Padjadjaran (Unpad)"];
    } else if (lowerName.includes("sastra") || lowerName.includes("bahasa") || lowerName.includes("sejarah") || lowerName.includes("antropologi") || lowerName.includes("seni") || lowerName.includes("desain")) {
        overview = `Program studi ${name} mengkaji budaya, bahasa, seni, dan dinamika sosial masyarakat. Mahasiswa didorong untuk mengeksplorasi kreativitas serta memahami nilai-nilai humaniora yang mempengaruhi peradaban manusia masa kini dan masa lalu.`;
        courses = ["Pengantar Linguistik/Sastra", "Sejarah Kebudayaan", "Estetika dan Kritik Seni", "Sosiologi Sastra", "Metodologi Penelitian Kualitatif", "Praktik Berkarya/Penerjemahan"];
        careers = ["Penulis/Editor", "Penerjemah (Translator/Interpreter)", "Kurator/Pekerja Seni", "Dosen/Peneliti", "Desainer Kreatif", "Diplomat (Kemenlu)"];
        campuses = ["Universitas Indonesia (UI)", "Universitas Gadjah Mada (UGM)", "Universitas Padjadjaran (Unpad)", "Institut Seni Indonesia (ISI)", "Universitas Udayana (Unud)"];
    } else if (lowerName.includes("hukum") || lowerName.includes("politik") || lowerName.includes("komunikasi") || lowerName.includes("hubungan") || lowerName.includes("sosiologi") || lowerName.includes("psikologi")) {
        overview = `Program studi ${name} mendalami struktur sosial, hukum, perilaku manusia, serta bagaimana manusia berinteraksi dan berkomunikasi dalam skala individu hingga tatanan negara. Ilmu ini esensial untuk menjaga ketertiban dan kesejahteraan masyarakat.`;
        courses = ["Pengantar Ilmu Hukum/Politik", "Teori Komunikasi", "Sosiologi Dasar", "Psikologi Sosial", "Hukum Tata Negara", "Analisis Kebijakan Publik"];
        careers = ["Ahli Hukum/Pengacara", "Analis Politik/Kebijakan", "Public Relations (PR)", "Jurnalis", "HR/Psikolog", "PNS/Diplomat"];
        campuses = ["Universitas Indonesia (UI)", "Universitas Gadjah Mada (UGM)", "Universitas Padjadjaran (Unpad)", "Universitas Airlangga (Unair)", "Universitas Brawijaya (UB)"];
    } else if (lowerName.includes("pertanian") || lowerName.includes("agribisnis") || lowerName.includes("agro") || lowerName.includes("kehutanan") || lowerName.includes("perikanan") || lowerName.includes("kelautan")) {
        overview = `Program studi ${name} mempelajari cara mengelola, membudidayakan, serta mempertahankan ekosistem sumber daya alam hayati. Lulusannya diharapkan mampu menciptakan ketahanan pangan dan pengelolaan lingkungan yang berkelanjutan.`;
        courses = ["Dasar Ilmu Tanah", "Klimatologi", "Manajemen Agribisnis", "Ekologi Hutan/Laut", "Bioteknologi Pertanian", "Sistem Informasi Geografis"];
        careers = ["Ahli Pertanian (Agronom)", "Manajer Perkebunan", "Konsultan Lingkungan", "Peneliti LIPI/BRIN", "Pengusaha Agribisnis", "PNS - Kementan/KLHK"];
        campuses = ["Institut Pertanian Bogor (IPB)", "Universitas Gadjah Mada (UGM)", "Universitas Brawijaya (UB)", "Universitas Hasanuddin (Unhas)", "Universitas Padjadjaran (Unpad)"];
    }

    return {
        id: `mp-auto-${Date.now()}-${index}`,
        programName: name,
        overview: overview,
        courses: JSON.stringify(courses),
        careers: JSON.stringify(careers),
        campuses: JSON.stringify(campuses),
        dateCreated: new Date().toISOString()
    };
};

const results = prodiList.map((name, idx) => generateData(name, idx));

fs.writeFileSync('98_new_mengenal_prodi.json', JSON.stringify(results, null, 2));
console.log('Successfully created 98_new_mengenal_prodi.json');
