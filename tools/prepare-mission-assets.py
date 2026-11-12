"""Prepare user-supplied models. Originals stay outside Git; output is content addressed."""
import argparse, hashlib, io, json, pathlib, struct, zipfile
from PIL import Image

FACE = {'eyeBlinkLeft','eyeBlinkRight','jawOpen','mouthClose','mouthFunnel','mouthPucker','mouthSmileLeft','mouthSmileRight','mouthLowerDownLeft','mouthLowerDownRight','mouthUpperUpLeft','mouthUpperUpRight','browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','eyeSquintLeft','eyeSquintRight','cheekSquintLeft','cheekSquintRight','mouthShrugUpper'}

def read_glb(data):
    pos, document, binary = 12, None, b''
    while pos < len(data):
        size, kind = struct.unpack_from('<II', data, pos)
        pos += 8
        if kind == 0x4E4F534A:
            document = json.loads(data[pos:pos + size])
        elif kind == 0x004E4942:
            binary = data[pos:pos + size]
        pos += size
    return document, binary

def prepare(document, binary, actor):
    document.pop('animations', None)
    for node in document.get('nodes', []):
        node.pop('extras', None)
    for scene in document.get('scenes', []):
        scene.pop('extras', None)
    for mesh in document.get('meshes', []):
        names = mesh.get('extras', {}).get('targetNames', [])
        keep = [i for i, name in enumerate(names) if name in FACE] if actor else list(range(len(names)))
        mesh['extras'] = {'targetNames': [names[i] for i in keep]}
        if 'weights' in mesh:
            mesh['weights'] = [mesh['weights'][i] for i in keep]
        for primitive in mesh['primitives']:
            if 'targets' in primitive:
                primitive['targets'] = [primitive['targets'][i] for i in keep]
                if not keep:
                    primitive.pop('targets')
    for material in document.get('materials', []):
        # CC/Faceit occlusion uses a Blender-only shader. Its opaque black glTF
        # fallback covers the eyeballs; disable that fallback, retain the actual eyes.
        if material.get('name','').startswith('Std_Eye_Occlusion'):
            material.setdefault('pbrMetallicRoughness', {})['baseColorFactor'] = [0,0,0,0]
        specular = material.get('extensions', {}).get('KHR_materials_specular', {})
        if 'specularColorFactor' in specular:
            specular['specularColorFactor'] = [min(1,v) for v in specular['specularColorFactor']]
        extension = material.get('extensions', {}).pop('KHR_materials_pbrSpecularGlossiness', None)
        if extension:
            pbr = {'baseColorFactor': extension.get('diffuseFactor', [1,1,1,1]), 'metallicFactor': 0, 'roughnessFactor': 1 - extension.get('glossinessFactor', 0)}
            if 'diffuseTexture' in extension:
                pbr['baseColorTexture'] = extension['diffuseTexture']
            material['pbrMetallicRoughness'] = pbr
    for key in ['extensionsUsed', 'extensionsRequired']:
        document[key] = [x for x in document.get(key, []) if x != 'KHR_materials_pbrSpecularGlossiness']
        if not document[key]:
            document.pop(key)
    used = set()
    for mesh in document.get('meshes', []):
        for primitive in mesh['primitives']:
            used.update(primitive.get('attributes', {}).values())
            if 'indices' in primitive:
                used.add(primitive['indices'])
            for target in primitive.get('targets', []):
                used.update(target.values())
    for skin in document.get('skins', []):
        if 'inverseBindMatrices' in skin:
            used.add(skin['inverseBindMatrices'])
    remap = {old: new for new, old in enumerate(sorted(used))}
    accessors = [document['accessors'][i] for i in sorted(used)]
    for mesh in document.get('meshes', []):
        for primitive in mesh['primitives']:
            primitive['attributes'] = {k: remap[v] for k,v in primitive['attributes'].items()}
            if 'indices' in primitive:
                primitive['indices'] = remap[primitive['indices']]
            for target in primitive.get('targets', []):
                for key in target:
                    target[key] = remap[target[key]]
    for skin in document.get('skins', []):
        if 'inverseBindMatrices' in skin:
            skin['inverseBindMatrices'] = remap[skin['inverseBindMatrices']]
    document['accessors'] = accessors
    replacements = {}
    for image in document.get('images', []):
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        picture = Image.open(io.BytesIO(binary[start:start + view['byteLength']]))
        limit = 2048 if not actor or ('Head' in image.get('name','') and 'Diffuse' in image.get('name','')) else 1024
        picture.thumbnail((limit,limit))
        output = io.BytesIO()
        picture.save(output, format='PNG' if image['mimeType'] == 'image/png' else 'JPEG', optimize=True)
        replacements[image['bufferView']] = output.getvalue()
    views_used = {a['bufferView'] for a in accessors if 'bufferView' in a}
    views_used.update(i['bufferView'] for i in document.get('images', []))
    for accessor in accessors:
        if 'sparse' in accessor:
            views_used.add(accessor['sparse']['indices']['bufferView'])
            views_used.add(accessor['sparse']['values']['bufferView'])
    view_map, views, packed = {}, [], bytearray()
    for old in sorted(views_used):
        view = dict(document['bufferViews'][old]);start = view.get('byteOffset',0)
        payload = replacements.get(old, binary[start:start+view['byteLength']])
        packed.extend(b'\0' * (-len(packed) % 4))
        view.update(buffer=0, byteOffset=len(packed), byteLength=len(payload))
        view_map[old] = len(views);views.append(view);packed.extend(payload)
    for entry in accessors + document.get('images', []):
        if 'bufferView' in entry:
            entry['bufferView'] = view_map[entry['bufferView']]
    for accessor in accessors:
        if 'sparse' in accessor:
            for part in ['indices', 'values']:
                accessor['sparse'][part]['bufferView'] = view_map[accessor['sparse'][part]['bufferView']]
    document['bufferViews'] = views
    document['buffers'] = [{'byteLength': len(packed)}]
    metadata = json.dumps(document, separators=(',',':')).encode();metadata += b' ' * (-len(metadata)%4)
    packed.extend(b'\0' * (-len(packed)%4))
    return struct.pack('<4sII', b'glTF',2,28+len(metadata)+len(packed))+struct.pack('<II',len(metadata),0x4E4F534A)+metadata+struct.pack('<II',len(packed),0x004E4942)+packed

def main():
    parser = argparse.ArgumentParser();parser.add_argument('uploads');parser.add_argument('output');args=parser.parse_args()
    source=pathlib.Path(args.uploads);output=pathlib.Path(args.output);output.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(source/'cartoon_Young_Boy_Glb.zip') as archive:
        boy=archive.read(next(n for n in archive.namelist() if n.endswith('.glb')))
    manifest={}
    for role,data in [('boy',boy),('city',(source/'lowpoly_city.glb').read_bytes())]:
        document,binary=read_glb(data);prepared=prepare(document,binary,role=='boy');digest=hashlib.sha256(prepared).hexdigest();name=f'{role}.{digest[:12]}.glb';(output/name).write_bytes(prepared)
        manifest[role]={'url':f'/assets/m01/{name}','sha256':digest,'bytes':len(prepared)}
        print(role,len(data),'->',len(prepared),name)
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

if __name__ == '__main__':
    main()
