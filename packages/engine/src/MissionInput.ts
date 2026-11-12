import { Vector2 } from 'three';
export class MissionInput {
  readonly keys = new Set<string>();
  readonly touch = new Vector2();
  constructor(
    private canvas: HTMLCanvasElement,
    private click: (event: PointerEvent) => void,
  ) {
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.clear);
    document.addEventListener('visibilitychange', this.clear);
    canvas.addEventListener('pointerup', this.click);
  }
  private down = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLElement &&
      /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName)
    )
      return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key))
      event.preventDefault();
    this.keys.add(event.key.toLowerCase());
  };
  private up = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };
  clear = () => {
    this.keys.clear();
    this.touch.set(0, 0);
  };
  direction() {
    const has = (...keys: string[]) => keys.some((key) => this.keys.has(key));
    return new Vector2(
      Number(has('d', 'arrowright')) - Number(has('a', 'arrowleft')) + this.touch.x,
      Number(has('s', 'arrowdown')) - Number(has('w', 'arrowup')) + this.touch.y,
    ).clampLength(0, 1);
  }
  dispose() {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.clear);
    this.canvas.removeEventListener('pointerup', this.click);
  }
}
