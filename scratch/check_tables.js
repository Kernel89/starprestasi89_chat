import fs from 'fs';
import path from 'path';

const tables = [
  'star_appUsers', 'star_schoolProfile', 'star_students', 'star_teachers',
  'star_rombels', 'star_assignments', 'star_submissions',
  'star_questionnaireSubmissions', 'star_attendanceLogs', 'star_classReports',
  'star_sessions', 'star_homeVisits', 'star_advocacies', 'star_conferences',
  'star_referrals', 'star_starData', 'star_sociometrySessions', 'star_forumPosts',
  'star_quotes', 'star_materials', 'star_schedule', 'star_universities',
  'star_studyPrograms', 'star_appointments', 'star_methodSteps',
  'star_counselorProfiles', 'star_alumni', 'star_messages',
  'star_privateCounseling', 'star_mengenalProdi', 'star_eqSubmissions',
  'star_aqSubmissions', 'star_sqSubmissions', 'star_studentJournals',
  'star_gradesConfig', 'star_km_subjects', 'star_class_subjects',
  'star_student_grades', 'star_graduation_info'
];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if(file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== '.wrangler' && file !== 'scratch') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const projectDir = 'd:/star prestasi/Evaluasi Stars Prestasi/stars-prestasi-k8.95-7 Backup data7 11 (53) kurikulum/project';
const allFiles = getAllFiles(projectDir, []);

const tableUsage = {};
tables.forEach(t => tableUsage[t] = 0);

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  tables.forEach(table => {
    if (content.includes(table)) {
      tableUsage[table]++;
    }
  });
});

const unused = [];
for (const [table, count] of Object.entries(tableUsage)) {
  if (count === 0) {
    unused.push(table);
  }
}

console.log('Unused tables:');
console.log(unused);
