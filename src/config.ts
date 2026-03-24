import type { Participant } from "@/types";

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: "Peserta 1", theme: "Cyberpunk City", color: 0xfd5901 },
  { name: "Peserta 2", theme: "Hutan Ajaib", color: 0xf78104 },
  { name: "Peserta 3", theme: "Underwater World", color: 0x249ea0 },
  { name: "Peserta 4", theme: "Steampunk", color: 0x005f60 },
];

export const PALETTE = {
  orange: { dark: 0xfd5901, mid: 0xf78104, gold: 0xfaab36 },
  teal: { bright: 0x249ea0, mid: 0x008083, dark: 0x005f60, veryDark: 0x003d3d },
  metal: { dark: 0x374151 },
  white: 0xffffff,
  black: 0x000000,
} as const;

export const MACHINE_COLORS = {
  foot: PALETTE.teal.veryDark,
  base: PALETTE.orange.dark,
  body: PALETTE.teal.mid,
  panel: PALETTE.teal.dark,
  trim: PALETTE.orange.gold,
  dome: 0xaaddff,
  cap: PALETTE.orange.dark,
  coinSlot: PALETTE.teal.veryDark,
  chute: PALETTE.teal.veryDark,
  handleStem: PALETTE.metal.dark,
  handleBall: PALETTE.orange.gold,
  star: PALETTE.orange.gold,
  sidePanel: 0x006566,
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
