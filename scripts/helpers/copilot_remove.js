const fs = require('fs');
const [,, instrFile] = process.argv;
if (!fs.existsSync(instrFile)) process.exit(0);
const START = '# --- BEGIN gd-skills ---';
const END   = '# --- END gd-skills ---';
let content = fs.readFileSync(instrFile, 'utf8');
const re = new RegExp(
  START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
  '[\\s\\S]*?' +
  END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
  '\\r?\\n?', 'g'
);
content = content.replace(re, '');
fs.writeFileSync(instrFile, content, 'utf8');
