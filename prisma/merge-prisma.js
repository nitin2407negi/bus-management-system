const fs = require('fs');
const path = require('path');

const baseSchema = fs.readFileSync(path.join(__dirname, '../prisma/base.prisma'), 'utf-8');

const modelsDir = path.join(__dirname, '../prisma/models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.prisma'));

let modelsContent = '';
for (const file of modelFiles) {
  modelsContent += '\n' + fs.readFileSync(path.join(modelsDir, file), 'utf-8');
}

const finalSchema = baseSchema + '\n' + modelsContent;
fs.writeFileSync(path.join(__dirname, '../prisma/schema.prisma'), finalSchema);

console.log('✅ Prisma schema.prisma merged successfully!');
