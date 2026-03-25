import type { Participant } from "@/types";

export const PALETTE = {
  paper: { light: 0xf7f0e4, mid: 0xeadbc2, dark: 0xd7c2a0 },
  earth: { light: 0xd6a06f, mid: 0xb86d44, dark: 0x7a4630 },
  maroon: { mid: 0x7b3c3d, dark: 0x4a2426 },
  olive: { mid: 0x9b8650, dark: 0x6d5c38 },
  ink: { brown: 0x2d1a0e, soft: 0x543727 },
  cream: 0xfffbf4,
  white: 0xffffff,
  black: 0x120d09,
} as const;

export const STYLE_COLORS = {
  outline: PALETTE.ink.brown,
  paper: PALETTE.paper.light,
  paperShadow: PALETTE.paper.dark,
  skyTop: PALETTE.cream,
  skyMid: PALETTE.paper.mid,
  skyBottom: 0xcfa579,
  fog: 0xf3e7d6,
  ground: 0xb98a60,
  groundShadow: 0x8b6040,
  accent: 0xd7783e,
  accentSoft: 0xe4ab69,
} as const;

export const FX_COLORS = {
  sparkles: [
    PALETTE.cream,
    PALETTE.paper.mid,
    STYLE_COLORS.accentSoft,
    PALETTE.maroon.mid,
    PALETTE.olive.mid,
  ],
  confetti: [
    STYLE_COLORS.accent,
    STYLE_COLORS.accentSoft,
    PALETTE.paper.mid,
    PALETTE.paper.dark,
    PALETTE.earth.mid,
    PALETTE.maroon.mid,
    PALETTE.olive.mid,
    PALETTE.cream,
  ],
  floatingStars: [STYLE_COLORS.accentSoft, PALETTE.paper.mid, PALETTE.olive.mid],
} as const;

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: "Peserta 1", theme: "Cyberpunk City", color: 0xc8744b },
  { name: "Peserta 2", theme: "Hutan Ajaib", color: 0xc49d54 },
  { name: "Peserta 3", theme: "Underwater World", color: 0x8b8f5a },
  { name: "Peserta 4", theme: "Steampunk", color: 0x8a4245 },
];

export const MACHINE_COLORS = {
  foot: PALETTE.earth.dark,
  base: PALETTE.earth.mid,
  body: PALETTE.earth.light,
  panel: PALETTE.paper.mid,
  trim: PALETTE.maroon.mid,
  dome: 0xfbf4ea,
  cap: PALETTE.earth.light,

  chute: PALETTE.paper.dark,
  handleStem: PALETTE.ink.soft,
  handleBall: STYLE_COLORS.accent,
  star: PALETTE.olive.mid,
  sidePanel: PALETTE.maroon.dark,
} as const;

const PARTICIPANT_SLOT_COUNT = 4;

function parseColorParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  return /^[0-9a-fA-F]{6}$/.test(value) ? parseInt(value, 16) : fallback;
}

/**
 * Parse four fixed participant slots from URL query params.
 *
 * Format:
 * ?p1Name=Alice&p1Theme=Space%20Noir&p1Color=ff0000
 * &p2Name=Bob&p2Theme=Ocean&p2Color=00ff00
 * ...through p4
 *
 * Missing or invalid values fall back to DEFAULT_PARTICIPANTS per slot.
 */
export function parseParticipantsFromURL(): Participant[] {
  const params = new URLSearchParams(window.location.search);

  return DEFAULT_PARTICIPANTS.map((participant, index) => {
    const slot = index + 1;
    const name = params.get(`p${slot}Name`)?.trim() || participant.name;
    const theme = params.get(`p${slot}Theme`)?.trim() || participant.theme;
    const color = parseColorParam(params.get(`p${slot}Color`), participant.color);

    return { name, theme, color };
  });
}

/**
 * Encode exactly four participant slots into URL query params.
 */
export function encodeParticipantsToURL(participants: Participant[]): string {
  if (participants.length !== PARTICIPANT_SLOT_COUNT) {
    throw new Error(`Expected exactly ${PARTICIPANT_SLOT_COUNT} participants`);
  }

  const params = new URLSearchParams();

  participants.forEach((participant, index) => {
    const slot = index + 1;
    params.set(`p${slot}Name`, participant.name.trim());
    params.set(`p${slot}Theme`, participant.theme.trim());
    params.set(`p${slot}Color`, participant.color.toString(16).padStart(6, "0"));
  });

  return `?${params.toString()}`;
}
