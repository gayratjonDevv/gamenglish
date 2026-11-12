"""Run through Blender against the supplied master; built-in rig drivers only."""
import bpy,json,pathlib,sys
output=pathlib.Path(sys.argv[sys.argv.index('--')+1])
control=bpy.data.objects['FaceitControlRig'];control.animation_data_create()
body=bpy.data.objects['CC_Base_Body'];presets={}
for name in ['Smile','Happy','Confused ','Nervous']:
    control.animation_data.action=bpy.data.actions[name]
    bpy.context.scene.frame_set(int(bpy.data.actions[name].frame_range[0]));bpy.context.view_layer.update()
    presets[name.strip()]={key.name:round(key.value,5) for key in body.data.shape_keys.key_blocks if abs(key.value)>.01}
output.write_text(json.dumps(presets,indent=2)+'\n')
print('Artist facial poses extracted:',', '.join(presets))
