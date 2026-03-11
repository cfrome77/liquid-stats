const fs = require('fs');
const path = require('path');

const TARGET = path.resolve('src/environments/environment.ts');
const LOCAL = path.resolve('src/environments/environment.local.ts');

// Restore local environment values
if (fs.existsSync(LOCAL)) {
  fs.copyFileSync(LOCAL, TARGET);
  fs.unlinkSync(LOCAL); // optional: cleanup
  console.log('🔓 Restored your local environment.ts values');
}