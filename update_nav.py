import os
import re

files = [
    'd:/Antigravity/raportk/src/pages/ReportEditor.jsx',
    'd:/Antigravity/raportk/src/pages/PrintPreview.jsx',
    'd:/Antigravity/raportk/src/pages/Home.jsx',
    'd:/Antigravity/raportk/src/pages/Dashboard.jsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'[\t ]*<nav className="lg:hidden fixed bottom-0.*?</nav>[\r\n]*', '', content, flags=re.DOTALL)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Processed {file}')
