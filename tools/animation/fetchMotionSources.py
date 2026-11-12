"""Fetch only the audited free animation sources; reject changed upstream bytes."""
import hashlib,json,pathlib,urllib.request,zipfile

root=pathlib.Path('asset-source/authoring');root.mkdir(parents=True,exist_ok=True)
sources=json.loads(pathlib.Path('content/mission-01-motion-sources.json').read_text())

def fetch(url,destination,expected):
    if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest()==expected:
        return
    data=urllib.request.urlopen(url,timeout=45).read()
    if hashlib.sha256(data).hexdigest()!=expected:
        raise ValueError('Upstream animation changed; inspect and approve the new source before updating its hash.')
    destination.write_bytes(data)

quaternius,mesh=sources['motions'];archive=root/'universal-animation-library.zip'
fetch(quaternius['download'],archive,quaternius['sha256'])
with zipfile.ZipFile(archive) as package:
    destination=(root/'motions').resolve()
    for member in package.infolist():
        if not (destination/member.filename).resolve().is_relative_to(destination):
            raise ValueError('Unsafe ZIP entry')
    package.extractall(destination)
for entry in mesh['files']:
    fetch('https://raw.githubusercontent.com/Mesh2Motion/mesh2motion-app/main/static/assets/human/animations/'+entry['name'],root/entry['name'],entry['sha256'])
print('Audited CC0 motion sources ready. Run npm run assets:animate.')
