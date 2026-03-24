import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "@/utils/EventEmitter";

describe("EventEmitter", () => {
  it("registers and fires listeners", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on("test", handler);
    emitter.emit("test", "arg1", "arg2");

    expect(handler).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("removes listeners with off", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on("test", handler);
    emitter.off("test", handler);
    emitter.emit("test");

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple listeners for the same event", () => {
    const emitter = new EventEmitter();
    const first = vi.fn();
    const second = vi.fn();

    emitter.on("test", first);
    emitter.on("test", second);
    emitter.emit("test");

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("clears all listeners on dispose", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on("test", handler);
    emitter.dispose();
    emitter.emit("test");

    expect(handler).not.toHaveBeenCalled();
  });
});
