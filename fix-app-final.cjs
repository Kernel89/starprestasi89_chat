const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Remove bad wrapSetter (this regex matches the exact bad block inside Toast)
const badWrapSetterRegex = /  const wrapSetter = \(setter\) => \{[\s\S]*?return \(valueOrFn\) => \{[\s\S]*?setter\(prev => \{[\s\S]*?const value = typeof valueOrFn === 'function' \? valueOrFn\(prev\) : valueOrFn;[\s\S]*?if \(!academicPeriod\) return value;[\s\S]*?return value\.map\(item => \{[\s\S]*?if \(!item\.tahun_pelajaran \|\| !item\.semester\) \{[\s\S]*?return \{ \.\.\.item, tahun_pelajaran: academicPeriod\.tahun_pelajaran, semester: academicPeriod\.semester \};[\s\S]*?\}[\s\S]*?return item;[\s\S]*?\}\);[\s\S]*?\}\);[\s\S]*?\};[\s\S]*?\};\n/g;
code = code.replace(badWrapSetterRegex, '');

// 2. Add wrapSetter right after academicPeriod definition
const academicPeriodDef = "const [academicPeriod, setAcademicPeriod] = useLocalStorage<{ tahun_pelajaran: string; semester: string } | null>('star_academic_period', null);";
const goodWrapSetter = `
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
if (!code.includes('const wrapSetter = (setter) => {')) {
  code = code.replace(academicPeriodDef, academicPeriodDef + '\n' + goodWrapSetter);
}

// 3. Add the filtered data variables exactly where they should be
const filteredInjection = `
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
  const filteredDcmSubmissions = React.useMemo(() => submissions.filter(isPeriodMatched), [submissions, academicPeriod]);
  const filteredSatisfactions = React.useMemo(() => feedbacks.filter(isPeriodMatched), [feedbacks, academicPeriod]);
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
if (!code.includes('filteredStudents = React.useMemo')) {
  code = code.replace('const allQuestionnaireSubmissions = useMemo(() => {', filteredInjection + '\n  const allQuestionnaireSubmissions = useMemo(() => {');
}

fs.writeFileSync('App.tsx', code);
console.log('Fixed for real this time!');
