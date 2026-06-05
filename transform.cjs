const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add auto-tagging useEffect
const useEffectInjection = `
  // --- PERIOD FILTERING LOGIC ---
  useEffect(() => {
    if (academicPeriod) {
      const p = academicPeriod;
      
      const tagData = (data, setter) => {
        let changed = false;
        const newData = data.map(item => {
          if (!item.tahun_pelajaran || !item.semester) {
            changed = true;
            return { ...item, tahun_pelajaran: p.tahun_pelajaran, semester: p.semester };
          }
          return item;
        });
        if (changed) setter(newData);
      };

      tagData(rombels, setRombels);
      tagData(sessions, setSessions);
      tagData(homeVisits, setHomeVisits);
      tagData(advocacies, setAdvocacies);
      tagData(conferences, setConferences);
      tagData(referrals, setReferrals);
      tagData(privateSessions, setPrivateSessions);
      tagData(appointments, setAppointments);
      tagData(assignments, setAssignments);
      tagData(questionnaireSubmissions, setQuestionnaireSubmissions);
      tagData(dcmSubmissions, setDcmSubmissions);
      tagData(satisfactions, setSatisfactions);
      tagData(sociometrySessions, setSociometrySessions);
      tagData(forumPosts, setForumPosts);
      tagData(classReports, setClassReports);
      tagData(attendanceLogs, setAttendanceLogs);
      tagData(studentJournals, setStudentJournals);
    }
  }, [academicPeriod]);

  // Filtered Data Variables
  const isPeriodMatched = (item) => !academicPeriod || (item.tahun_pelajaran === academicPeriod.tahun_pelajaran && item.semester === academicPeriod.semester);

  const filteredRombels = useMemo(() => rombels.filter(isPeriodMatched), [rombels, academicPeriod]);
  const filteredSessions = useMemo(() => sessions.filter(isPeriodMatched), [sessions, academicPeriod]);
  const filteredHomeVisits = useMemo(() => homeVisits.filter(isPeriodMatched), [homeVisits, academicPeriod]);
  const filteredAdvocacies = useMemo(() => advocacies.filter(isPeriodMatched), [advocacies, academicPeriod]);
  const filteredConferences = useMemo(() => conferences.filter(isPeriodMatched), [conferences, academicPeriod]);
  const filteredReferrals = useMemo(() => referrals.filter(isPeriodMatched), [referrals, academicPeriod]);
  const filteredPrivateSessions = useMemo(() => privateSessions.filter(isPeriodMatched), [privateSessions, academicPeriod]);
  const filteredAppointments = useMemo(() => appointments.filter(isPeriodMatched), [appointments, academicPeriod]);
  const filteredAssignments = useMemo(() => assignments.filter(isPeriodMatched), [assignments, academicPeriod]);
  const filteredQuestionnaireSubmissions = useMemo(() => questionnaireSubmissions.filter(isPeriodMatched), [questionnaireSubmissions, academicPeriod]);
  const filteredDcmSubmissions = useMemo(() => dcmSubmissions.filter(isPeriodMatched), [dcmSubmissions, academicPeriod]);
  const filteredSatisfactions = useMemo(() => satisfactions.filter(isPeriodMatched), [satisfactions, academicPeriod]);
  const filteredSociometrySessions = useMemo(() => sociometrySessions.filter(isPeriodMatched), [sociometrySessions, academicPeriod]);
  const filteredForumPosts = useMemo(() => forumPosts.filter(isPeriodMatched), [forumPosts, academicPeriod]);
  const filteredClassReports = useMemo(() => classReports.filter(isPeriodMatched), [classReports, academicPeriod]);
  const filteredAttendanceLogs = useMemo(() => attendanceLogs.filter(isPeriodMatched), [attendanceLogs, academicPeriod]);
  const filteredStudentJournals = useMemo(() => studentJournals.filter(isPeriodMatched), [studentJournals, academicPeriod]);

  const filteredStudents = useMemo(() => {
    if (!academicPeriod) return students;
    const activeRombelNames = new Set(filteredRombels.map(r => r.name));
    return students.filter(s => activeRombelNames.has(s.class));
  }, [students, filteredRombels, academicPeriod]);
  // ------------------------------
`;

code = code.replace(/const isCurriculumOrAdmin = user\.role === 'curriculum' \|\| user\.role === 'super_admin';\s*const showForcePeriodModal = isCurriculumOrAdmin && !academicPeriod;/, 'const showForcePeriodModal = user.id !== \'\' && !academicPeriod;');

code = code.replace(/const currentPeriodText = academicPeriod \? \`\$\{academicPeriod.tahun_pelajaran\} - \$\{academicPeriod.semester\}\` : 'Pilih Periode';/, useEffectInjection + '\n  const currentPeriodText = academicPeriod ? \`${academicPeriod.tahun_pelajaran} - ${academicPeriod.semester}\` : \'Pilih Periode\';');

// Replace passed props with filtered versions!
const regexMap = {
  'rombels={rombels}': 'rombels={filteredRombels}',
  'sessions={sessions}': 'sessions={filteredSessions}',
  'homeVisits={homeVisits}': 'homeVisits={filteredHomeVisits}',
  'advocacies={advocacies}': 'advocacies={filteredAdvocacies}',
  'conferences={conferences}': 'conferences={filteredConferences}',
  'referrals={referrals}': 'referrals={filteredReferrals}',
  'privateSessions={privateSessions}': 'privateSessions={filteredPrivateSessions}',
  'appointments={appointments}': 'appointments={filteredAppointments}',
  'assignments={assignments}': 'assignments={filteredAssignments}',
  'questionnaireSubmissions={questionnaireSubmissions}': 'questionnaireSubmissions={filteredQuestionnaireSubmissions}',
  'dcmSubmissions={dcmSubmissions}': 'dcmSubmissions={filteredDcmSubmissions}',
  'satisfactions={satisfactions}': 'satisfactions={filteredSatisfactions}',
  'sociometrySessions={sociometrySessions}': 'sociometrySessions={filteredSociometrySessions}',
  'classReports={classReports}': 'classReports={filteredClassReports}',
  'attendanceLogs={attendanceLogs}': 'attendanceLogs={filteredAttendanceLogs}',
  'studentJournals={studentJournals}': 'studentJournals={filteredStudentJournals}'
};

const lines = code.split('\n');
let insideSuperAdmin = false;
let insideTracer = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('<SuperAdminPage')) insideSuperAdmin = true;
  if (line.includes('</SuperAdminPage>')) insideSuperAdmin = false;
  if (line.includes('<TracerStudyHub')) insideTracer = true;
  if (line.includes('</TracerStudyHub>')) insideTracer = false;
  
  if (line.includes('<StudentBioReport')) continue;

  if (!insideSuperAdmin && !insideTracer) {
    Object.keys(regexMap).forEach(key => {
      if (line.includes(key)) {
        lines[i] = line.replace(key, regexMap[key]);
      }
    });
    if (line.includes('students={students}') && !line.includes('setStudents={setStudents}')) {
      lines[i] = line.replace('students={students}', 'students={filteredStudents}');
    }
  }
}

code = lines.join('\n');

// Import useMemo and useEffect if not present
if (!code.includes('useMemo')) {
  code = code.replace(/import React, \{([^}]+)\}/, 'import React, { useMemo, useEffect, $1 }');
}

fs.writeFileSync('App.tsx', code);
console.log('App.tsx updated');
