/** Inspect the JSON chunk before GLTFLoader can issue unbudgeted external requests. */
export function inspectGLB(bytes: Uint8Array): { animations: { name?: string }[] } {
  if (bytes.byteLength < 20) throw new Error('Invalid GLB header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== bytes.byteLength
  )
    throw new Error('Invalid GLB v2 header/length');
  const length = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || 20 + length > bytes.byteLength)
    throw new Error('Missing GLB JSON chunk');
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + length)).trim()) as {
    buffers?: { uri?: string }[];
    images?: { uri?: string }[];
    animations?: { name?: string }[];
  };
  for (const item of [...(json.buffers ?? []), ...(json.images ?? [])])
    if (item.uri && !item.uri.startsWith('data:'))
      throw new Error('GLB must embed buffers and textures; external URI rejected');
  return { animations: json.animations ?? [] };
}
