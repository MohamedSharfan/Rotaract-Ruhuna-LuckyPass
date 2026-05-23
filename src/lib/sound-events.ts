export type LuckyPassSoundEvent =
  | "button"
  | "coin-drop"
  | "machine-click"
  | "ticket-reveal"
  | "ticket-spin"
  | "winner-countdown"
  | "confetti"
  | "jackpot";

export function emitSoundEvent(name: LuckyPassSoundEvent, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lucky-pass:sound", { detail: { name, ...detail } }));
}
