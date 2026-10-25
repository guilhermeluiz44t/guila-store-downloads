"""Package only program files. Never include local indexes, logs, or screenshots."""
from pathlib import Path
import sys
import zipfile

root = Path.cwd()
files = []
for folder, suffixes in [('arquivista', {'.py'}), ('web', {'.html', '.css', '.js', '.svg', '.png', '.ico'}), ('tools', {'.py', '.sh', '.m', '.ps1'})]:
    files += [p for p in (root / folder).rglob('*') if p.is_file() and p.suffix in suffixes and '__pycache__' not in p.parts]
files += [p for p in root.iterdir() if p.is_file() and (p.name in {'run.py'} or p.suffix.lower() in {'.bat', '.command'})]
with zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('Arquivista/LEIA-ME.txt', 'ARQUIVISTA — pacote portátil\n\nRequer Python 3.9 ou mais recente.\nWindows: abra Arquivista.bat.\nMac: abra Arquivista.command; o lançador opcional é criado por tools/instalar-mac.sh.\n\nPara atualizar: encerre o app, faça uma cópia de segurança da pasta data e substitua somente os arquivos do programa. Preserve data e a configuração ARQUIVISTA_DATA, se usada.\n\nOs arquivos e o índice ficam no computador. A consulta de atualização à Guila Store envia apenas a versão, a plataforma e a arquitetura.\n')
    for item in sorted(files):
        archive.write(item, 'Arquivista/' + item.relative_to(root).as_posix())
if not files:
    raise SystemExit('No source files found')
print('Portable program packaged without data, logs, credentials, or audit files.')
