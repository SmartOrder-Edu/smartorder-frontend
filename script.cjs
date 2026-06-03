const fs = require('fs');
const content = fs.readFileSync('src/views/KnowledgeBase/Detail.vue', 'utf8');
const styleContent = content.split('<style scoped lang="scss">')[1];
let open = 0;
const lines = styleContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  open += (lines[i].match(/\{/g) || []).length;
  open -= (lines[i].match(/\}/g) || []).length;
  if (lines[i].includes('{') || lines[i].includes('}')) {
    console.log(i + 1, open, lines[i].trim());
  }
}
