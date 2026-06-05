const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add import
if (!code.includes("import AcademicPeriodModal")) {
  code = code.replace("import Dashboard from './pages/Dashboard';", "import Dashboard from './pages/Dashboard';\nimport AcademicPeriodModal from './components/AcademicPeriodModal';");
}

// 2. Add isPeriodModalOpen state
if (!code.includes("const [isPeriodModalOpen, setIsPeriodModalOpen]")) {
  code = code.replace("const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);", "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);");
}

// 3. Add handleLogout with academicPeriod clearing
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

// 4. Add showForcePeriodModal and the modal trigger logic before <Router>
const oldRouterStart = `  return (
    <Router>`;
const newRouterStart = `  const showForcePeriodModal = user && user.id !== '' && user.role !== 'student' && !academicPeriod;

  return (
    <Router>`;

if (!code.includes("showForcePeriodModal = user")) {
  code = code.replace(oldRouterStart, newRouterStart);
}

// 5. Add AcademicPeriodModal right before </Router>
const oldRouterEnd = `    </Router>
  );`;
const newRouterEnd = `      <AcademicPeriodModal 
        isOpen={!!showForcePeriodModal || isPeriodModalOpen} 
        onClose={() => setIsPeriodModalOpen(false)} 
        currentPeriod={academicPeriod} 
        onSave={setAcademicPeriod} 
        forceSelect={!!showForcePeriodModal}
      />
    </Router>
  );`;

if (!code.includes("<AcademicPeriodModal")) {
  code = code.replace(oldRouterEnd, newRouterEnd);
}

// 6. Add the header button to change period (desktop and mobile)
const mobileHeaderTarget = `            <h1 className="text-lg font-black text-slate-800 tracking-tight">STAR PRESTASI K8.9</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">`;

const mobileHeaderReplacement = `            <h1 className="text-lg font-black text-slate-800 tracking-tight">STAR PRESTASI K8.9</h1>
          </div>
          {user && user.id !== "" && academicPeriod && (
            <button onClick={() => setIsPeriodModalOpen(true)} className="flex flex-col items-end mr-3 hover:opacity-80 transition-opacity">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Periode</span>
              <span className="text-xs font-bold text-indigo-600">{academicPeriod.tahun_pelajaran} - {academicPeriod.semester}</span>
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">`;

if (!code.includes("setIsPeriodModalOpen(true)") && code.includes(mobileHeaderTarget)) {
  code = code.replace(mobileHeaderTarget, mobileHeaderReplacement);
}

const desktopHeaderTarget = `              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>`;

const desktopHeaderReplacement = `              <div className="flex items-center gap-6">
                {user && user.id !== "" && academicPeriod && (
                  <button onClick={() => setIsPeriodModalOpen(true)} className="flex flex-col items-end hover:bg-slate-50 p-2 rounded-xl transition-colors border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tahun Pelajaran / Semester</span>
                    <span className="text-sm font-bold text-indigo-600">{academicPeriod.tahun_pelajaran} - {academicPeriod.semester}</span>
                  </button>
                )}
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>`;

if (!code.includes("Tahun Pelajaran / Semester") && code.includes(desktopHeaderTarget)) {
  code = code.replace(desktopHeaderTarget, desktopHeaderReplacement);
}

fs.writeFileSync('App.tsx', code);
console.log('Re-applied all modal fixes!');
