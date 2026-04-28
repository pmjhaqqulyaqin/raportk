const fs = require('fs');

const files = [
    'd:/Antigravity/raportk/src/pages/ReportEditor.jsx',
    'd:/Antigravity/raportk/src/pages/PrintPreview.jsx',
    'd:/Antigravity/raportk/src/pages/Home.jsx',
    'd:/Antigravity/raportk/src/pages/Dashboard.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/[\t ]*<nav className="lg:hidden fixed bottom-0[\s\S]*?<\/nav>[\r\n]*/, '');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Processed ${file}`);
});
