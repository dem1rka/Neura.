export interface GameAnswer {
  situationId: number;
  choice: number;
  seconds: number;
  changes: number;
  help: number;
}
export interface GameSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  answers: GameAnswer[];
}
export interface QuestionnaireSession {
  answers: Record<string, number>;
  completedAt?: string;
}
export interface MRIResult {
  id: string;
  completedAt: string;
  source: "example" | "local";
  simulated: boolean;
}
export interface Observation {
  href?: string;
  id: string;
  title: string;
  kind: "game" | "questionnaire" | "mri";
  date: string;
  demo: boolean;
  simulated?: boolean;
}
