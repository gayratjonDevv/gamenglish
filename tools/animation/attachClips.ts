import { AnimationClip, PropertyBinding } from 'three';
type Node = { name?: string };
type Document = {
  nodes: Node[];
  buffers: { byteLength: number }[];
  bufferViews: object[];
  accessors: object[];
  animations?: object[];
};
export function attachClips(bytes: Buffer, clips: AnimationClip[]) {
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as Document;
  const binary = bytes.subarray(28 + jsonLength);
  const chunks: Buffer[] = [binary];
  let offset = binary.length;
  function accessor(data: ArrayLike<number>, size: number) {
    const buffer = Buffer.from(new Float32Array(Array.from(data)).buffer);
    const view = document.bufferViews.length;
    document.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length });
    chunks.push(buffer);
    offset += buffer.length;
    const id = document.accessors.length;
    const value: Record<string, unknown> = {
      bufferView: view,
      componentType: 5126,
      count: data.length / size,
      type: size === 1 ? 'SCALAR' : size === 3 ? 'VEC3' : 'VEC4',
    };
    if (size === 1) {
      value.min = [data[0]];
      value.max = [data[data.length - 1]];
    }
    document.accessors.push(value);
    return id;
  }
  document.animations = clips.map((clip) => {
    const channels: object[] = [],
      samplers: object[] = [];
    const times = accessor(clip.tracks[0]!.times, 1);
    for (const track of clip.tracks) {
      const parts = track.name.split('.');
      const property = parts.pop();
      const nodeName = parts.join('.');
      const node = document.nodes.findIndex(
        (entry) => entry.name && PropertyBinding.sanitizeNodeName(entry.name) === nodeName,
      );
      if (node < 0) throw new Error(`Animation target missing: ${nodeName}`);
      const size = property === 'quaternion' ? 4 : 3;
      const output = accessor(track.values, size);
      const sampler = samplers.length;
      samplers.push({ input: times, output, interpolation: 'LINEAR' });
      channels.push({
        sampler,
        target: { node, path: property === 'quaternion' ? 'rotation' : 'translation' },
      });
    }
    return { name: clip.name, channels, samplers };
  });
  document.buffers = [{ byteLength: offset }];
  const metadata = Buffer.from(JSON.stringify(document));
  const text = Buffer.concat([metadata, Buffer.alloc((4 - (metadata.length % 4)) % 4, 32)]);
  const output = Buffer.alloc(28 + text.length + offset);
  output.write('glTF');
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(text.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  text.copy(output, 20);
  output.writeUInt32LE(offset, 20 + text.length);
  output.writeUInt32LE(0x004e4942, 24 + text.length);
  Buffer.concat(chunks).copy(output, 28 + text.length);
  return output;
}
