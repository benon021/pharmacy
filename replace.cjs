const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let files = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files = files.concat(walkDir(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const files = walkDir('./src');
let changedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    // Use regular expressions globally
    newContent = newContent.replace(/bg-white\/5(?!0)/g, 'bg-card dark:bg-white/5');
    newContent = newContent.replace(/border-white\/10/g, 'border-border dark:border-white/10');
    newContent = newContent.replace(/border-white\/5(?!0)/g, 'border-border dark:border-white/5');
    newContent = newContent.replace(/text-white/g, 'text-foreground dark:text-white');
    newContent = newContent.replace(/bg-\[#09090b\]/g, 'bg-background');
    newContent = newContent.replace(/bg-white\/\[0\.02\]/g, 'bg-muted dark:bg-white/[0.02]');
    newContent = newContent.replace(/bg-[#0B0E14]/g, 'bg-background');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedCount++;
    }
}

console.log(`Updated ${changedCount} files successfully.`);
