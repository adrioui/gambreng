export interface Participant {
  name: string;
  theme: string;
  color: number;
}

export enum GameStateType {
  Idle = "idle",
  Triggered = "triggered",
  BuildingUp = "buildingUp",
  Capturing = "capturing",
  Dispensing = "dispensing",
  Hatching = "hatching",
  Done = "done",
}

export interface LoopCallback {
  update(delta: number, elapsed: number): void;
}
