
const fs = require('fs');
const content = fs.readFileSync('/home/mamun/Lexora/src/pages/MatchingDrill.jsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    balance += opens - closes;
    if (opens !== 0 || closes !== 0) {
        // console.log(`Line ${i + 1}: ${balance} (opens: ${opens}, closes: ${closes})`);
    }
});

console.log('Final balance:', balance);
