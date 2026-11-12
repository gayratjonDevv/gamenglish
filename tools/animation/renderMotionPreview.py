"""Render the actual retargeted model for visual motion QA. No substitute meshes."""
import bpy, json, math, pathlib, struct, sys
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
root = pathlib.Path(args[0]); out = pathlib.Path(args[1]); out.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root/'manifest.json').read_text())
source = root/manifest['boy']['url'].split('/')[-1]
raw = source.read_bytes(); size = struct.unpack_from('<I', raw, 12)[0]
document = json.loads(raw[20:20+size]); document['animations'] = [a for a in document['animations'] if a['name']=='wave']
metadata = json.dumps(document,separators=(',',':')).encode(); metadata += b' '*(-len(metadata)%4)
binary = raw[28+size:]; preview = out/'wave.glb'
preview.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(metadata)+len(binary))+struct.pack('<II',len(metadata),0x4e4f534a)+metadata+struct.pack('<II',len(binary),0x004e4942)+binary)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def load(path, name):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=str(path))
    objects = list(set(bpy.data.objects)-before)
    group = bpy.data.objects.new(name,None); bpy.context.collection.objects.link(group)
    for obj in objects:
        if obj.parent not in objects: obj.parent = group
    return group, objects

city, town = load(root/manifest['city']['url'].split('/')[-1], 'Town')
city.scale = (.01,)*3; city.location.z = -1.94
for obj in town:
    if 'Icosphere.020' in obj.name: obj.hide_render = True
boy, objects = load(preview, 'Boy'); bpy.context.view_layer.update()
points = [o.matrix_world@Vector(v) for o in objects if o.type=='MESH' for v in o.bound_box]
lo = Vector(tuple(min(p[i] for p in points) for i in range(3))); hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
scale = 1.42/(hi.z-lo.z); boy.scale=(scale,)*3
boy.location=(13-(lo.x+hi.x)*scale/2,14.6-(lo.y+hi.y)*scale/2,-lo.z*scale)
for obj in objects:
    if obj.type=='MESH' and obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks:
            key.value = .24 if key.name in ['mouthSmileLeft','mouthSmileRight'] else 0

bpy.ops.object.camera_add(location=(14.3,12.5,1.35)); camera=bpy.context.object
camera.rotation_euler=(Vector((13,14.6,.97))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=85; camera.data.dof.use_dof=True; camera.data.dof.focus_distance=(Vector((13,14.6,1.1))-camera.location).length; camera.data.dof.aperture_fstop=4
scene=bpy.context.scene; scene.camera=camera

def area(name, position, target, power, color, size):
    bpy.ops.object.light_add(type='AREA',location=position); light=bpy.context.object; light.name=name
    light.rotation_euler=(Vector(target)-light.location).to_track_quat('-Z','Y').to_euler()
    light.data.energy=power; light.data.color=color; light.data.shape='DISK'; light.data.size=size

area('Key',(11,11,5),(13,14.6,1),650,(1,.86,.71),4)
area('Fill',(16,12,2.5),(13,14.6,1),400,(.72,.85,1),3)
area('Rim',(12,17,3),(13,14.6,1),800,(1,.92,.76),2)
bpy.ops.object.light_add(type='SUN',location=(10,7,20)); sun=bpy.context.object; sun.rotation_euler=(.4,-.35,-.3); sun.data.energy=1.3; sun.data.angle=.2
scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.5,.65,.8,1); scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=8; scene.cycles.use_denoising=False
scene.render.resolution_x=720; scene.render.resolution_y=1280; scene.render.resolution_percentage=100
scene.render.fps=24; scene.frame_start=1; scene.frame_end=119; scene.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'preview.blend'))
for frame in ([55] if len(args)>2 and args[2]=='hero' else [1,28,55,82,110]):
    scene.cycles.samples = 48 if len(args)>2 and args[2]=='hero' else 8
    scene.frame_set(frame); scene.render.filepath=str(out/f'frame-{frame:03}.png'); bpy.ops.render.render(write_still=True)
