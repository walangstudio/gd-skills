const fs = require('fs'), path = require('path');
const [,, instrFile, rulesDir, version] = process.argv;
const START = '# --- BEGIN gd-skills ---';
const END   = '# --- END gd-skills ---';

let existing = '';
if (fs.existsSync(instrFile)) {
  existing = fs.readFileSync(instrFile, 'utf8');
  const re = new RegExp(
    START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '[\\s\\S]*?' +
    END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\r?\\n?', 'g'
  );
  existing = existing.replace(re, '');
} else {
  existing = '# GitHub Copilot Instructions\n\n';
  fs.mkdirSync(path.dirname(instrFile), { recursive: true });
}

let section = `\n${START}\n# gd-skills v${version} - Game Development Rules\n\n`;
const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).sort();
for (const f of files) {
  let raw = fs.readFileSync(path.join(rulesDir, f), 'utf8');
  raw = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  section += raw + '\n';
}
section += `${END}\n`;
fs.writeFileSync(instrFile, existing + section, 'utf8');
