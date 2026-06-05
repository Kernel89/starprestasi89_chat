const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Update showForcePeriodModal
code = code.replace(
  "const showForcePeriodModal = user.id !== '' && !academicPeriod;",
  "const showForcePeriodModal = user.id !== '' && user.role !== 'student' && !academicPeriod;"
);

// 2. Update handleLogout
const oldLogout = `  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('star_currentUser');
    notify('Berhasil keluar.', 'info');
  };`;

const newLogout = `  const handleLogout = () => {
    setUser(null);
    setAcademicPeriod(null);
    localStorage.removeItem('star_currentUser');
    localStorage.removeItem('star_academic_period');
    notify('Berhasil keluar.', 'info');
  };`;

if (code.includes(oldLogout)) {
  code = code.replace(oldLogout, newLogout);
}

fs.writeFileSync('App.tsx', code);
console.log('Fixed login/logout!');
