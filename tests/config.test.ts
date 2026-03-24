import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PARTICIPANTS, encodeParticipantsToURL, parseParticipantsFromURL } from "@/config";

describe("parseParticipantsFromURL", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns defaults when no query params are present", () => {
    expect(parseParticipantsFromURL()).toEqual(DEFAULT_PARTICIPANTS);
  });

  it("parses valid fixed-slot participants from the URL", () => {
    window.history.replaceState(
      {},
      "",
      "/?p1Name=Alice&p1Theme=Space%20Noir&p1Color=ff0000&p2Name=Bob&p2Theme=Ocean&p2Color=00ff00",
    );

    expect(parseParticipantsFromURL()).toEqual([
      { name: "Alice", theme: "Space Noir", color: 0xff0000 },
      { name: "Bob", theme: "Ocean", color: 0x00ff00 },
      DEFAULT_PARTICIPANTS[2],
      DEFAULT_PARTICIPANTS[3],
    ]);
  });

  it("falls back per slot when the color is invalid", () => {
    window.history.replaceState({}, "", "/?p1Name=Alice&p1Theme=Space&p1Color=invalid");

    expect(parseParticipantsFromURL()[0]).toEqual({
      name: "Alice",
      theme: "Space",
      color: DEFAULT_PARTICIPANTS[0].color,
    });
  });
});

describe("encodeParticipantsToURL", () => {
  it("encodes all four participant slots", () => {
    const encoded = encodeParticipantsToURL([
      { name: "A", theme: "T1", color: 0xff0000 },
      { name: "B", theme: "T2", color: 0x00ff00 },
      { name: "C", theme: "T3", color: 0x0000ff },
      { name: "D", theme: "T4", color: 0xffffff },
    ]);

    expect(encoded).toContain("p1Name=A");
    expect(encoded).toContain("p2Theme=T2");
    expect(encoded).toContain("p4Color=ffffff");
  });

  it("round-trips punctuation and spaces safely", () => {
    const participants = [
      { name: "Alice, One", theme: "Space: Noir", color: 0xff0000 },
      { name: "Bob Two", theme: "Deep Ocean", color: 0x00ff00 },
      { name: "Cici", theme: "Forest Light", color: 0x0000ff },
      { name: "Danu", theme: "Retro City", color: 0xffffff },
    ];

    window.history.replaceState({}, "", encodeParticipantsToURL(participants));

    expect(parseParticipantsFromURL()).toEqual(participants);
  });

  it("rejects participant arrays that do not contain exactly four items", () => {
    expect(() =>
      encodeParticipantsToURL([
        { name: "A", theme: "One", color: 0xffffff },
        { name: "B", theme: "Two", color: 0x000000 },
      ]),
    ).toThrow("Expected exactly 4 participants");
  });
});
