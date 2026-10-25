"""Verify that release archives contain program files and exclude user data."""
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

script = Path(__file__).with_name('package-arquivista.py').resolve()
with tempfile.TemporaryDirectory(prefix='guila-package-test-') as temp:
    root = Path(temp)
    for name in ['arquivista/__init__.py', 'web/index.html', 'run.py', 'Arquivista.bat', 'data/arquivista.db', '.env', 'auditoria/screenshot.png', 'README.md']:
        file = root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text('test', encoding='utf-8')
    target = root / 'package.zip'
    subprocess.run([sys.executable, str(script), str(target)], cwd=root, check=True)
    with zipfile.ZipFile(target) as archive:
        names = set(archive.namelist())
    assert 'Arquivista/arquivista/__init__.py' in names
    assert 'Arquivista/run.py' in names
    assert 'Arquivista/LEIA-ME.txt' in names
    assert not any('data/' in n or '.env' in n or 'auditoria/' in n or 'README.md' in n for n in names)
print('Release excludes indexes, credentials, audit captures, and private documentation.')
