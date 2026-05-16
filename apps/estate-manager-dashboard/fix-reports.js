const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) {
      const t = fs.readFileSync(p, 'utf8');
      if (t.includes('motion.div')) {
        fs.writeFileSync(p, t.split('motion.div').join('motion.div'));
      }
    }
  }
}

walk(path.join(__dirname, 'src/components/manager/pages/reports'));
