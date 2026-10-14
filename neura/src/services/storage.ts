import type { GameSession, QuestionnaireSession, MRIResult } from "../types";
const prefix = "neura.v1.";
export function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(prefix + key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    window.dispatchEvent(new Event("neura-storage-error"));
    return false;
  }
}
export const service = {
  game: () => read<GameSession | null>("game", null),
  saveGame: (value: GameSession) => write("game", value),
  questionnaire: () =>
    read<QuestionnaireSession>("questionnaire", { answers: {} }),
  saveQuestionnaire: (value: QuestionnaireSession) =>
    write("questionnaire", value),
  mri: () => read<MRIResult[]>("mri", []),
  saveMRI: (value: MRIResult) =>
    write("mri", [value, ...service.mri()].slice(0, 20)),
  async overview() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      game: service.game(),
      questionnaire: service.questionnaire(),
      mri: service.mri(),
    };
  },
};
export function summarize(session: GameSession) {
  return {
    seconds: session.answers.reduce((n, a) => n + a.seconds, 0),
    changes: session.answers.reduce((n, a) => n + a.changes, 0),
    help: session.answers.reduce((n, a) => n + a.help, 0),
  };
}
