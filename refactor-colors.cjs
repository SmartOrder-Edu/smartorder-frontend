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
    
    // background colors
    content = content.replace(/background(-color)?:\s*(?:#fff|#ffffff|white)\s*;/gi, 'background$1: var(--color-card-bg);');
    
    // text colors
    content = content.replace(/color:\s*(?:#333|#333333)\s*;/gi, 'color: var(--color-text-primary);');
    content = content.replace(/color:\s*(?:#666|#666666)\s*;/gi, 'color: var(--color-text-regular);');
    content = content.replace(/color:\s*(?:#999|#999999)\s*;/gi, 'color: var(--color-text-secondary);');
    content = content.replace(/color:\s*(?:#303133)\s*;/gi, 'color: var(--color-text-primary);');
    content = content.replace(/color:\s*(?:#606266)\s*;/gi, 'color: var(--color-text-regular);');
    content = content.replace(/color:\s*(?:#909399)\s*;/gi, 'color: var(--color-text-secondary);');
    
    // borders
    content = content.replace(/border(-[a-z]+)?:\s*1px\s+solid\s+(?:#ebeef5|#e4e7ed|#dcdfe6|#eee|#eeeeee)\s*;/gi, 'border$1: 1px solid var(--color-border);');
    content = content.replace(/border-color:\s*(?:#ebeef5|#e4e7ed|#dcdfe6|#eee|#eeeeee)\s*;/gi, 'border-color: var(--color-border);');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
    }
  }
});

console.log('Modified ' + count + ' files.');
