export const analyzeDcmData = async (classLabel: string, stats: any, topIssues: any[]) => {
  const dominantDomain = [...stats].sort((a, b) => b.score - a.score)[0];
  let insight = `### Laporan Analisis Diagnostik (Offline) - Kelas ${classLabel}\n\n`;
  insight += `1. **Domain Dominan**: **${dominantDomain.domain}** (${dominantDomain.score}%).\n\n`;
  insight += `2. **Masalah Utama**:\n`;
  topIssues.slice(0, 3).forEach((issue) => {
    insight += `- **${issue.text}**: ${issue.count} siswa.\n`;
  });
  insight += `\n*Catatan: Analisis ini menggunakan logika lokal.*`;
  return insight;
};

export const analyzeSociometryData = async (classLabel: string, stats: any) => {
  const starStudents = stats.dominantData.map((d: any) => d.name).join(', ');
  const isolateStudents = stats.isolates.map((s: any) => s.name).join(', ') || 'Tidak ada';
  let insight = `### Analisis Jaringan Sosial (Offline) - Kelas ${classLabel}\n\n`;
  insight += `1. **Stars**: **${starStudents}**.\n\n`;
  insight += `2. **Isolates**: **${isolateStudents}**.\n\n`;
  insight += `\n*Catatan: Analisis ini menggunakan logika lokal.*`;
  return insight;
};

export const getCounselingAdvice = async (query: string) => {
  const q = query.toLowerCase();
  const knowledgeBase = [
    { key: ['bully', 'perundungan'], resp: "Untuk kasus bullying: Lindungi korban, panggil pelaku secara pribadi, lakukan mediasi, dan edukasi kelas." },
    { key: ['game', 'gadget', 'hp'], resp: "Kecanduan gadget: Gunakan pendekatan REBT dan kerjasama dengan orang tua." },
    { key: ['karir', 'kuliah', 'minat'], resp: "Eksplorasi karir: Gunakan teori Holland (RIASEC) untuk mencocokkan kepribadian dengan karir." }
  ];
  const match = knowledgeBase.find(item => item.key.some(k => q.includes(k)));
  if (match) return `(Mode Offline) ${match.resp}`;
  return "Sistem sedang berjalan dalam mode offline. Silakan coba lagi nanti.";
};
