const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;

walk('src', function(filePath) {
  if (filePath.endsWith('.vue')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // replace white rgba backgrounds
    content = content.replace(/background(-color)?:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(1|0?\.9\d*)\s*\)\s*;/gi, 'background$1: var(--color-card-bg);');
    content = content.replace(/background(-color)?:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?\.[5-8]\d*\s*\)\s*;/gi, 'background$1: var(--color-card-bg-secondary);');
    
    // borders using rgba black
    content = content.replace(/border(-[a-z]+)?:\s*1px\s+solid\s+rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.0[0-9]\s*\)\s*;/gi, 'border$1: 1px solid var(--color-border);');
    content = content.replace(/border-color:\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.0[0-9]\s*\)\s*;/gi, 'border-color: var(--color-border);');

    // box-shadow using rgba black
    content = content.replace(/box-shadow:\s*(0\s+[0-9px\s-]+\s*)rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.0[0-9]\s*\)\s*;/gi, 'box-shadow: $1 var(--color-shadow);');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
    }
  }
});

console.log('Modified ' + count + ' files.');
