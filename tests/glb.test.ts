import { it, expect } from 'vitest';
import { inspectGLB } from '@gamenglish/engine';
function glb(json: unknown) {
  let text = JSON.stringify(json);
  while (text.length % 4) text += ' ';
  const data = new TextEncoder().encode(text),
    bytes = new Uint8Array(20 + data.length),
    view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, data.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(data, 20);
  return bytes;
}
it('accepts embedded resources and rejects external unbudgeted model dependencies', () => {
  expect(
    inspectGLB(
      glb({
        asset: { version: '2.0' },
        buffers: [{ byteLength: 0 }],
        animations: [{ name: 'Idle' }],
      }),
    ).animations[0]?.name,
  ).toBe('Idle');
  expect(() => inspectGLB(glb({ images: [{ uri: 'https://unexpected.test/huge.png' }] }))).toThrow(
    'external URI',
  );
});
it('rejects corrupted GLB headers', () => {
  expect(() => inspectGLB(new Uint8Array(20))).toThrow('header');
});
