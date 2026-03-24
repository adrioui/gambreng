export interface Participant {
  name: string;
  theme: string;
  color: number;
}

export enum GameStateType {
  Idle = "idle",
  Entering = "entering",
  Ready = "ready",
  Spinning = "spinning",
  Revealing = "revealing",
  Done = "done",
}

export interface LoopCallback {
  update(delta: number, elapsed: number): void;
}
