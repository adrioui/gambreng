import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/state/GameState";
import { GameStateType } from "@/types";

describe("GameState", () => {
  it("starts in the idle state", () => {
    const gameState = new GameState();

    expect(gameState.current).toBe(GameStateType.Idle);
  });

  it("allows valid transitions in sequence", () => {
    const gameState = new GameState();

    expect(gameState.transition(GameStateType.Triggered)).toBe(true);
    expect(gameState.transition(GameStateType.BuildingUp)).toBe(true);
    expect(gameState.transition(GameStateType.Capturing)).toBe(true);
    expect(gameState.transition(GameStateType.Dispensing)).toBe(true);
    expect(gameState.transition(GameStateType.Hatching)).toBe(true);
    expect(gameState.transition(GameStateType.Done)).toBe(true);
    expect(gameState.transition(GameStateType.Idle)).toBe(true);
    expect(gameState.current).toBe(GameStateType.Idle);
  });

  it("rejects invalid transitions and warns once", () => {
    const gameState = new GameState();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(gameState.transition(GameStateType.Capturing)).toBe(false);
    expect(gameState.current).toBe(GameStateType.Idle);
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
  });

  it("emits a change payload on valid transitions", () => {
    const gameState = new GameState();
    const handler = vi.fn();
    gameState.on("change", handler);

    gameState.transition(GameStateType.Triggered);

    expect(handler).toHaveBeenCalledWith({
      from: GameStateType.Idle,
      to: GameStateType.Triggered,
    });
  });

  it("emits the previous state when reset is called", () => {
    const gameState = new GameState();
    const handler = vi.fn();
    gameState.on("change", handler);
    gameState.transition(GameStateType.Triggered);

    handler.mockClear();
    gameState.reset();

    expect(handler).toHaveBeenCalledWith({
      from: GameStateType.Triggered,
      to: GameStateType.Idle,
    });
  });
});
