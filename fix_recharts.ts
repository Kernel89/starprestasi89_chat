import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<ResponsiveContainer')) {
        content = content.replace(/<ResponsiveContainer width="100%" height="100%">/g, '<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

walk('./pages');
