import { PMREMGenerator, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
/** Used only as light probes. No generated room geometry enters the visible world. */
export function createMissionLighting(renderer: WebGLRenderer) {
  const room = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  try {
    return generator.fromScene(room, 0.04);
  } finally {
    room.dispose();
    generator.dispose();
  }
}
