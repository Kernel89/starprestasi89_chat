const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const injection = `
  const wrapSetter = (setter) => {
    return (valueOrFn) => {
      setter(prev => {
        const value = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
        if (!academicPeriod) return value;
        return value.map(item => {
          if (!item.tahun_pelajaran || !item.semester) {
            return { ...item, tahun_pelajaran: academicPeriod.tahun_pelajaran, semester: academicPeriod.semester };
          }
          return item;
        });
      });
    };
  };
`;

if (!code.includes('const wrapSetter = ')) {
  code = code.replace(/\s*return \(/, '\n' + injection + '\n  return (');
}

const settersToWrap = [
  'setRombels', 'setSessions', 'setHomeVisits', 'setAdvocacies', 
  'setConferences', 'setReferrals', 'setPrivateSessions', 
  'setAppointments', 'setAssignments', 'setQuestionnaireSubmissions', 
  'setDcmSubmissions', 'setSatisfactions', 'setSociometrySessions', 
  'setForumPosts', 'setClassReports', 'setAttendanceLogs', 'setStudentJournals'
];

const lines = code.split('\n');
let insideSuperAdmin = false;
let insideTracer = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('<SuperAdminPage')) insideSuperAdmin = true;
  if (line.includes('</SuperAdminPage>')) insideSuperAdmin = false;
  if (line.includes('<TracerStudyHub')) insideTracer = true;
  if (line.includes('</TracerStudyHub>')) insideTracer = false;
  
  if (!insideSuperAdmin && !insideTracer && (line.trim().startsWith('<') || line.includes('={set') || line.includes('Route'))) {
    settersToWrap.forEach(setter => {
      const target = `${setter}={${setter}}`;
      if (line.includes(target) && !line.includes(`wrapSetter(${setter})`)) {
        lines[i] = lines[i].replace(target, `${setter}={wrapSetter(${setter})}`);
      }
    });
  }
}

code = lines.join('\n');
fs.writeFileSync('App.tsx', code);
console.log('App.tsx setters wrapped successfully.');
