const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const injection = `
  // --- FILTERED DATA VARIABLES ---
  const isPeriodMatched = (item) => !academicPeriod || (item.tahun_pelajaran === academicPeriod.tahun_pelajaran && item.semester === academicPeriod.semester);

  const filteredRombels = React.useMemo(() => rombels.filter(isPeriodMatched), [rombels, academicPeriod]);
  const filteredSessions = React.useMemo(() => sessions.filter(isPeriodMatched), [sessions, academicPeriod]);
  const filteredHomeVisits = React.useMemo(() => homeVisits.filter(isPeriodMatched), [homeVisits, academicPeriod]);
  const filteredAdvocacies = React.useMemo(() => advocacies.filter(isPeriodMatched), [advocacies, academicPeriod]);
  const filteredConferences = React.useMemo(() => conferences.filter(isPeriodMatched), [conferences, academicPeriod]);
  const filteredReferrals = React.useMemo(() => referrals.filter(isPeriodMatched), [referrals, academicPeriod]);
  const filteredPrivateSessions = React.useMemo(() => privateSessions.filter(isPeriodMatched), [privateSessions, academicPeriod]);
  const filteredAppointments = React.useMemo(() => appointments.filter(isPeriodMatched), [appointments, academicPeriod]);
  const filteredAssignments = React.useMemo(() => assignments.filter(isPeriodMatched), [assignments, academicPeriod]);
  const filteredQuestionnaireSubmissions = React.useMemo(() => questionnaireSubmissions.filter(isPeriodMatched), [questionnaireSubmissions, academicPeriod]);
  const filteredDcmSubmissions = React.useMemo(() => dcmSubmissions.filter(isPeriodMatched), [dcmSubmissions, academicPeriod]);
  const filteredSatisfactions = React.useMemo(() => satisfactions.filter(isPeriodMatched), [satisfactions, academicPeriod]);
  const filteredSociometrySessions = React.useMemo(() => sociometrySessions.filter(isPeriodMatched), [sociometrySessions, academicPeriod]);
  const filteredForumPosts = React.useMemo(() => forumPosts.filter(isPeriodMatched), [forumPosts, academicPeriod]);
  const filteredClassReports = React.useMemo(() => classReports.filter(isPeriodMatched), [classReports, academicPeriod]);
  const filteredAttendanceLogs = React.useMemo(() => attendanceLogs.filter(isPeriodMatched), [attendanceLogs, academicPeriod]);
  const filteredStudentJournals = React.useMemo(() => studentJournals.filter(isPeriodMatched), [studentJournals, academicPeriod]);

  const filteredStudents = React.useMemo(() => {
    if (!academicPeriod) return students;
    const activeRombelNames = new Set(filteredRombels.map(r => r.name));
    return students.filter(s => activeRombelNames.has(s.class));
  }, [students, filteredRombels, academicPeriod]);
  // -------------------------------
`;

// 1. Remove the bad injection
const startIndex = code.indexOf('// --- FILTERED DATA VARIABLES ---');
const endIndex = code.indexOf('// -------------------------------') + '// -------------------------------'.length;
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
}

// 2. Insert it before allQuestionnaireSubmissions
if (!code.includes('filteredStudents =')) {
  code = code.replace('const allQuestionnaireSubmissions = useMemo(() => {', injection + '\n  const allQuestionnaireSubmissions = useMemo(() => {');
}

fs.writeFileSync('App.tsx', code);
console.log('Fixed completely!');
