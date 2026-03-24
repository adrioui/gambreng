import { EventEmitter } from "@/utils/EventEmitter";

export class Sizes extends EventEmitter {
  width: number;
  height: number;
  pixelRatio: number;

  constructor() {
    super();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    window.addEventListener("resize", this.onResize);
  }

  private onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.emit("resize");
  };

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    super.dispose();
  }
}
