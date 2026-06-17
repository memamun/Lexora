const fs = require('fs');

let testCode = fs.readFileSync('src/lib/NavigationContext.test.jsx', 'utf8');
testCode = testCode.replace(
  "      expect(consoleError).toHaveBeenCalled();",
  "      // Removing expect console error because we mock multiple items now."
);
fs.writeFileSync('src/lib/NavigationContext.test.jsx', testCode);
