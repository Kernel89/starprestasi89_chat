const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  "const filteredDcmSubmissions = React.useMemo(() => dcmSubmissions.filter(isPeriodMatched), [dcmSubmissions, academicPeriod]);",
  "const filteredDcmSubmissions = React.useMemo(() => submissions.filter(isPeriodMatched), [submissions, academicPeriod]);"
);

code = code.replace(
  "const filteredSatisfactions = React.useMemo(() => satisfactions.filter(isPeriodMatched), [satisfactions, academicPeriod]);",
  "const filteredSatisfactions = React.useMemo(() => feedbacks.filter(isPeriodMatched), [feedbacks, academicPeriod]);"
);

fs.writeFileSync('App.tsx', code);
console.log('Fixed typings!');
