const fs = require('fs');

let testCode = fs.readFileSync('src/lib/NavigationContext.test.jsx', 'utf8');
testCode = testCode.replace(
  "  });\n});\n\n  describe('activeTab interactions",
  "  });\n\n  describe('activeTab interactions"
);
testCode += "});\n";
fs.writeFileSync('src/lib/NavigationContext.test.jsx', testCode);
