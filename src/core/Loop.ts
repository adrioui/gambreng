import type { LoopCallback } from "@/types";

export class Loop {
  private callbacks: Set<LoopCallback> = new Set();
  private animationId: number | null = null;
  private clock = { start: Date.now() };

  start(): void {
    const tick = (): void => {
      const elapsed = (Date.now() - this.clock.start) * 0.001;
      const delta = 1 / 60; // Fixed delta for consistency
      this.callbacks.forEach((cb) => cb.update(delta, elapsed));
      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  add(callback: LoopCallback): void {
    this.callbacks.add(callback);
  }

  remove(callback: LoopCallback): void {
    this.callbacks.delete(callback);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }
}
