const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATE = path.resolve('src/environments/environment.template.ts');
const TARGET = path.resolve('src/environments/environment.ts');
const LOCAL = path.resolve('src/environments/environment.local.ts');

// Only run if environment.ts is staged
const stagedFiles = execSync('git diff --cached --name-only').toString();
if (!stagedFiles.includes('src/environments/environment.ts')) process.exit(0);

// Backup local environment values
if (fs.existsSync(TARGET)) {
  fs.copyFileSync(TARGET, LOCAL);
}

// Reset to template
const templateContent = fs.readFileSync(TEMPLATE, 'utf8');
const targetContent = fs.readFileSync(TARGET, 'utf8');

if (templateContent !== targetContent) {
  fs.writeFileSync(TARGET, templateContent);
  // Stage the reset file
  execSync('git add ' + TARGET);
  console.log('🔒 Reset environment.ts to template before commit');
}