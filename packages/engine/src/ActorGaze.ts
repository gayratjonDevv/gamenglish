import { MathUtils, Quaternion, Vector3, type Object3D } from 'three';
export class ActorGaze {
  private head: Object3D | undefined;
  private target = new Vector3();
  private enabled = false;
  private yaw = 0;
  private pitch = 0;
  private position = new Vector3();
  private localDirection = new Vector3();
  private world = new Quaternion();
  private inverse = new Quaternion();
  private offset = new Quaternion();
  private rotation = new Quaternion();
  private x = new Vector3(1, 0, 0);
  private y = new Vector3(0, 1, 0);
  constructor(private root: Object3D) {
    this.head = root.getObjectByName('headx');
  }
  lookAt(point: Vector3) {
    this.target.copy(point);
    this.enabled = true;
  }
  clear() {
    this.enabled = false;
    this.yaw = 0;
    this.pitch = 0;
  }
  update(delta: number) {
    const head = this.head;
    if (!head?.parent || !this.enabled) return;
    this.root.updateMatrixWorld(true);
    this.root.getWorldQuaternion(this.world);
    this.inverse.copy(this.world).invert();
    head.getWorldPosition(this.position);
    this.localDirection.copy(this.target).sub(this.position).applyQuaternion(this.inverse);
    const yaw = MathUtils.clamp(
      Math.atan2(this.localDirection.x, this.localDirection.z),
      -0.55,
      0.55,
    );
    const pitch = MathUtils.clamp(
      -Math.atan2(this.localDirection.y, Math.hypot(this.localDirection.x, this.localDirection.z)),
      -0.28,
      0.32,
    );
    this.yaw = MathUtils.damp(this.yaw, yaw, 9, delta);
    this.pitch = MathUtils.damp(this.pitch, pitch, 7, delta);
    this.offset
      .setFromAxisAngle(this.y, this.yaw)
      .multiply(this.rotation.setFromAxisAngle(this.x, this.pitch));
    this.offset.premultiply(this.world).multiply(this.inverse);
    head.getWorldQuaternion(this.rotation).premultiply(this.offset);
    head.parent.getWorldQuaternion(this.inverse).invert();
    head.quaternion.copy(this.rotation.premultiply(this.inverse)).normalize();
    head.updateMatrixWorld(true);
  }
}
