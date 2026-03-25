import { EventEmitter } from "@/utils/EventEmitter";
import { GameStateType } from "@/types";

const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameStateType.Idle]: [GameStateType.Triggered],
  [GameStateType.Triggered]: [GameStateType.BuildingUp],
  [GameStateType.BuildingUp]: [GameStateType.Capturing],
  [GameStateType.Capturing]: [GameStateType.Dispensing],
  [GameStateType.Dispensing]: [GameStateType.Hatching],
  [GameStateType.Hatching]: [GameStateType.Done],
  [GameStateType.Done]: [GameStateType.Idle],
};

export class GameState extends EventEmitter {
  current: GameStateType = GameStateType.Idle;

  transition(to: GameStateType): boolean {
    if (!VALID_TRANSITIONS[this.current].includes(to)) {
      console.warn(`Invalid transition: ${this.current} → ${to}`);
      return false;
    }
    const from = this.current;
    this.current = to;
    this.emit("change", { from, to });
    return true;
  }

  reset(): void {
    const from = this.current;
    this.current = GameStateType.Idle;
    this.emit("change", { from, to: GameStateType.Idle });
  }

  is(state: GameStateType): boolean {
    return this.current === state;
  }
}
