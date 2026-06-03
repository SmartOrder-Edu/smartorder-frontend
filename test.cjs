const fs = require('fs');
const content = fs.readFileSync('src/views/KnowledgeBase/Detail.vue', 'utf8');
const startIndex = content.indexOf('<style scoped lang="scss">') + '<style scoped lang="scss">'.length;
const endIndex = content.indexOf('</style>');
const styleContent = content.substring(startIndex, endIndex);
fs.writeFileSync('temp.scss', styleContent);
