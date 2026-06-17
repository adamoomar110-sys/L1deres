import os
import glob
import re

# Append CSS
css_path = 'style.css'
with open('footer.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

with open(css_path, 'a', encoding='utf-8') as f:
    f.write('\n\n' + css_content)

# Update HTML files
html_files = glob.glob('*.html')

footer_html = """
    <footer class="app-footer">
        &copy; 2026 <strong>Omar Adamo</strong>. Todos los derechos reservados. <br>
        Lavadero Estética Vehicular • Software Independiente
    </footer>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace existing footers (various patterns)
    content = re.sub(r'<footer[^>]*>.*?</footer>', '', content, flags=re.DOTALL)
    content = re.sub(r'<p>\s*(?:&copy;|©).*?</p>', '', content, flags=re.DOTALL)
    content = re.sub(r'&copy;\s*2026.*?reservados\.', '', content, flags=re.DOTALL)
    
    # Clean up empty spaces before closing body
    content = re.sub(r'\s*</body>', f'\n{footer_html}\n</body>', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Footers actualizados en todos los archivos HTML y CSS agregado.")
