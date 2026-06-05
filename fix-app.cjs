const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Replace isCurriculumOrAdmin usage with just user
code = code.replace(/\{isCurriculumOrAdmin && academicPeriod && \(/g, '{user && user.id !== "" && academicPeriod && (');

fs.writeFileSync('App.tsx', code);
console.log('Fixed App.tsx');
