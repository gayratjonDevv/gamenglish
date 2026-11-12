import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
type GeometryDocument = { images: unknown[]; textures: unknown[]; materials: unknown[] };
/** Node cannot decode browser images. Keep the actual geometry, skin and morph bytes. */
export async function readPreparedModel(path: string) {
  const bytes = await readFile(path);
  const length = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + length).toString()) as GeometryDocument;
  document.images = [];
  document.textures = [];
  document.materials = (document.materials ?? []).map(() => ({
    pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] },
  }));
  const body = bytes.subarray(28 + length);
  const text = Buffer.from(JSON.stringify(document));
  const padded = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 32)]);
  const output = Buffer.alloc(28 + padded.length + body.length);
  output.write('glTF');
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(padded.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(output, 20);
  output.writeUInt32LE(body.length, 20 + padded.length);
  output.writeUInt32LE(0x004e4942, 24 + padded.length);
  body.copy(output, 28 + padded.length);
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(output.buffer, '');
}
