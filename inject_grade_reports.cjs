const fs = require('fs');
const path = 'pages/../App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('import GradeReports from')) {
    content = content.replace(
        "import GradeManagement from './pages/GradeManagement';",
        "import GradeManagement from './pages/GradeManagement';\nimport GradeReports from './pages/GradeReports';"
    );
}

// 2. Add SidebarItem (Curriculum)
const sidebarItemCurriculum = `{user.role === 'curriculum' && <SidebarItem to="/grade-management" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} label="Manajemen Nilai" onClick={closeMobileMenu} />}`;
const newSidebarItemCurriculum = `{user.role === 'curriculum' && <SidebarItem to="/grade-reports" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} label="Laporan Manajemen Nilai" onClick={closeMobileMenu} />}`;

content = content.replace(sidebarItemCurriculum, sidebarItemCurriculum + '\\n            ' + newSidebarItemCurriculum);

// 3. Add SidebarItem (Super Admin / Counselor)
const sidebarItemAdmin = `<SidebarItem to="/grade-management" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} label="Manajemen Nilai" onClick={closeMobileMenu} />`;
const newSidebarItemAdmin = `<SidebarItem to="/grade-reports" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} label="Laporan Manajemen Nilai" onClick={closeMobileMenu} />`;

content = content.replace(sidebarItemAdmin, sidebarItemAdmin + '\\n                  ' + newSidebarItemAdmin);

// 4. Add Route
const routeGradeManagement = `              <Route path="/grade-management" element={(user.role === 'super_admin' || user.role === 'counselor' || user.role === 'curriculum') ? <GradeManagement
                students={students}
                setStudents={setStudents}
                alumni={alumni}
                setAlumni={setAlumni}
                rombels={rombels}
                classSubjects={classSubjects}
                setClassSubjects={setClassSubjects}
                studentGrades={studentGrades}
                setStudentGrades={setStudentGrades}
                schoolProfile={safeSchoolProfile}
                gradesConfig={gradesConfig}
              /> : <Navigate to="/" replace />} />`;

const routeGradeReports = `              <Route path="/grade-reports" element={(user.role === 'super_admin' || user.role === 'counselor' || user.role === 'curriculum') ? <GradeReports
                students={students}
                setStudents={setStudents}
                alumni={alumni}
                setAlumni={setAlumni}
                rombels={rombels}
                classSubjects={classSubjects}
                schoolProfile={safeSchoolProfile}
              /> : <Navigate to="/" replace />} />`;

content = content.replace(routeGradeManagement, routeGradeManagement + '\\n' + routeGradeReports);

fs.writeFileSync(path, content, 'utf8');
console.log('App.tsx injected successfully!');
