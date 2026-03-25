import type { Participant } from "@/types";

export const PALETTE = {
  paper: { light: 0xffffff, mid: 0xfaab36, dark: 0xf78104 },
  earth: { light: 0xfaab36, mid: 0xf78104, dark: 0xfd5901 },
  maroon: { mid: 0xfd5901, dark: 0xf78104 },
  olive: { mid: 0x249ea0, dark: 0x008083 },
  ink: { brown: 0x005f60, soft: 0x008083 },
  cream: 0xffffff,
  white: 0xffffff,
  black: 0x005f60,
} as const;

export const STYLE_COLORS = {
  outline: PALETTE.ink.brown,
  paper: PALETTE.paper.light,
  paperShadow: PALETTE.paper.mid,
  skyTop: PALETTE.paper.light,
  skyMid: PALETTE.paper.light,
  skyBottom: PALETTE.paper.mid,
  fog: PALETTE.paper.light,
  ground: PALETTE.paper.mid,
  groundShadow: PALETTE.earth.mid,
  accent: PALETTE.olive.mid,
  accentSoft: PALETTE.olive.dark,
} as const;

export const FX_COLORS = {
  sparkles: [
    PALETTE.earth.dark,
    PALETTE.earth.mid,
    PALETTE.earth.light,
    PALETTE.paper.light,
    STYLE_COLORS.accent,
  ],
  confetti: [
    PALETTE.earth.dark,
    PALETTE.earth.mid,
    PALETTE.earth.light,
    PALETTE.paper.mid,
    PALETTE.maroon.mid,
    STYLE_COLORS.accent,
    STYLE_COLORS.accentSoft,
    PALETTE.paper.light,
  ],
  floatingStars: [PALETTE.paper.mid, PALETTE.earth.mid, STYLE_COLORS.accent],
} as const;

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: "Peserta 1", theme: "Cyberpunk City", color: 0xfd5901 },
  { name: "Peserta 2", theme: "Hutan Ajaib", color: 0xf78104 },
  { name: "Peserta 3", theme: "Underwater World", color: 0xfaab36 },
  { name: "Peserta 4", theme: "Steampunk", color: 0x249ea0 },
];

export const MACHINE_COLORS = {
  foot: PALETTE.ink.brown,
  base: PALETTE.earth.mid,
  body: PALETTE.earth.light,
  panel: PALETTE.paper.light,
  trim: PALETTE.ink.brown,
  dome: PALETTE.paper.light,
  cap: PALETTE.earth.light,

  chute: PALETTE.earth.mid,
  handleStem: PALETTE.ink.brown,
  handleBall: PALETTE.earth.light,
  star: STYLE_COLORS.accent,
  sidePanel: PALETTE.ink.soft,
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
