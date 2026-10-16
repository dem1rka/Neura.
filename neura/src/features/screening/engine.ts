import { allQuestions, domains, forms, links, txt, type Domain, type Text } from "./content";

export type Answer = 0 | 1 | 2 | 3 | null;
export interface ScreeningRecord {
  schemaVersion: 1;
  id: string;
  ageMonths: number;
  language: "ru" | "kk" | "en";
  demo: boolean;
  date: string;
  regression: boolean | null;
  answers: Record<string, Answer>;
  mchat?: { total: number; followUp?: number };
  aq10?: { total: number; noLearningDisability: boolean | null };
}
export type Status = "positive" | "negative" | "pending" | "ineligible";
export interface ScreenResult {
  instrument: string;
  total: number;
  max: number;
  status: Status;
  explanation: Text;
  source: string;
}
export const statusLabels: Record<Status, Text> = {
  positive: txt("Порог направления достигнут", "Жолдау шегіне жетті", "Referral threshold reached"),
  negative: txt("Порог направления не достигнут", "Жолдау шегіне жетпеді", "Below referral threshold"),
  pending: txt("Нужно уточняющее интервью", "Нақтылаушы сұхбат қажет", "Follow-up interview needed"),
  ineligible: txt("Автоинтерпретация недоступна", "Автоматты түсіндіру қолжетімсіз", "Automatic interpretation unavailable"),
};

export function screenResults(record: ScreeningRecord): ScreenResult[] {
  const results: ScreenResult[] = [];
  if (record.mchat) {
    const { total, followUp } = record.mchat;
    let status: Status;
    let explanation: Text;
    if (record.ageMonths < 16 || record.ageMonths > 30) {
      status = "ineligible";
      explanation = txt("Возраст вне диапазона 16–30 месяцев, принятого в этой версии по материалам CDC. Обсудите подходящий инструмент со специалистом.", "Жас CDC материалдарына сай осы нұсқада қолданылатын 16–30 ай аралығынан тыс. Тиісті құралды маманмен талқылаңыз.", "Age is outside this version's 16–30 month range based on CDC materials. Discuss a suitable tool with a professional.");
    } else if (total >= 8 || (total >= 3 && followUp !== undefined && followUp >= 2)) {
      status = "positive";
      explanation = txt("По протоколу требуется направление на диагностическую оценку и раннюю помощь. Положительный скрининг не подтверждает РАС.", "Хаттама бойынша диагностикалық бағалауға және ерте көмекке жолдау қажет. Оң скрининг нәтижесі АСБ диагнозын растамайды.", "The protocol calls for referral for diagnostic evaluation and early intervention. A positive screen does not confirm autism.");
    } else if (total >= 3 && followUp === undefined) {
      status = "pending";
      explanation = txt("При 3–7 баллах нужен официальный Follow-Up по отмеченным пунктам. Первичного балла недостаточно для итогового результата.", "3–7 балл болғанда белгіленген тармақтар бойынша ресми Follow-Up сұхбаты қажет. Бастапқы балл қорытынды нәтиже үшін жеткіліксіз.", "Scores of 3–7 require the official Follow-Up for flagged items. The initial score alone is insufficient for a final result.");
    } else {
      status = "negative";
      explanation = txt("Порог не достигнут; это не исключает РАС или другие трудности. При беспокойстве обратитесь к специалисту; если ребёнку меньше 24 месяцев, повторите скрининг в 24 месяца.", "Шекке жеткен жоқ; бұл АСБ немесе басқа қиындықтарды жоққа шығармайды. Алаңдаушылық болса, маманға жүгініңіз; бала 24 айға толмаған болса, скринингті 24 айда қайталаңыз.", "The threshold was not reached; this does not rule out autism or other difficulties. Seek advice for concerns; if under 24 months, repeat screening at 24 months.");
    }
    results.push({ instrument: "M-CHAT-R/F", total, max: 20, status, explanation, source: links.scoring });
  }
  if (record.aq10) {
    const eligible = record.ageMonths >= 48 && record.ageMonths < 144 && record.aq10.noLearningDisability === true;
    const positive = record.aq10.total >= 6;
    results.push({
      instrument: "AQ-10 Child", total: record.aq10.total, max: 10,
      status: !eligible ? "ineligible" : positive ? "positive" : "negative",
      explanation: !eligible
        ? txt("Оригинальный бланк предназначен для 4–11 лет без интеллектуальных нарушений. Возраст или применимость не подтверждены; нужна оценка специалиста.", "Түпнұсқа бланк зияткерлік бұзылыстары жоқ 4–11 жастағы балаларға арналған. Жас немесе қолдануға жарамдылық расталмаған; маманның бағалауы қажет.", "The original form is for ages 4–11 without a learning disability (UK usage). Age or suitability is unconfirmed; professional review is needed.")
        : positive
          ? txt("При 6 и более баллах авторы предлагают рассмотреть направление на специализированную оценку. Это не диагноз и не процент вероятности РАС.", "6 немесе одан көп балл болса, авторлар мамандандырылған бағалауға жолдауды қарастыруды ұсынады. Бұл диагноз немесе АСБ ықтималдығының пайызы емес.", "At 6 or more, the authors suggest considering referral for specialist assessment. This is neither a diagnosis nor an autism probability.")
          : txt("Балл ниже порога 6. Это не исключает РАС; сохраняющиеся опасения стоит обсудить со специалистом.", "Балл 6 шегінен төмен. Бұл АСБ-ны жоққа шығармайды; сақталған алаңдаушылықты маманмен талқылаған жөн.", "The score is below 6. This does not rule out autism; discuss ongoing concerns with a professional."),
      source: links.aq,
    });
  }
  return results;
}

export function analyze(record: ScreeningRecord) {
  const factors = (Object.keys(domains) as Domain[]).map((domain) => {
    const items = allQuestions.filter((q) => q.domain === domain);
    const known = items.filter((q) => typeof record.answers[q.id] === "number");
    const sum = known.reduce((n, q) => n + (record.answers[q.id] as number), 0);
    return {
      domain, answered: known.length, count: items.length,
      score: known.length === items.length ? sum : null,
      max: items.length * 3,
      // Author-defined demonstration threshold, not a validated clinical cutoff.
      flagged: known.length === items.length && sum >= items.length * 2,
    };
  });
  const completion = forms.map((form) => ({
    id: form.id,
    answered: form.questions.filter((q) => typeof record.answers[q.id] === "number").length,
    count: form.questions.length,
  }));
  return { factors, completion, screens: screenResults(record), regression: record.regression === true };
}

// Fixed, fictional examples. Labels are explicitly authored fixtures, not derived
// from predictions and never taken from user uploads or used to train a model.
const fixtures = [
  { total: 1, truth: false, level: 0 },
  { total: 9, truth: true, level: 3 },
  { total: 4, followUp: 2, truth: false, level: 2 },
  { total: 2, truth: true, level: 1 },
  { total: 7, truth: true, level: 3 },
  { total: 3, truth: false, level: 1 },
  { total: 6, truth: true, level: 2 },
  { total: 5, truth: false, level: 0 },
];
export const demoCohort = fixtures.map((fixture, i) => {
  const record: ScreeningRecord = {
    schemaVersion: 1, id: `DEMO-${String(i + 1).padStart(3, "0")}`,
    ageMonths: i < 4 ? 24 : 84, language: i % 2 ? "kk" : "ru", demo: true,
    date: "2026-10-16", regression: false,
    answers: Object.fromEntries(allQuestions.map((q, j) => [q.id, Math.min(3, Math.max(0, fixture.level + (j % 5 === 0 ? 1 : 0))) as Answer])),
    ...(i < 4
      ? { mchat: { total: fixture.total, ...(fixture.followUp !== undefined ? { followUp: fixture.followUp } : {}) } }
      : { aq10: { total: fixture.total, noLearningDisability: true } }),
  };
  return { record, truth: fixture.truth };
});

export function demoMetrics(cohort = demoCohort) {
  let tp = 0, tn = 0, fp = 0, fn = 0, excluded = 0;
  for (const { record, truth } of cohort) {
    const screens = screenResults(record);
    if (screens.length !== 1 || !["positive", "negative"].includes(screens[0].status)) { excluded++; continue; }
    const prediction = screens[0].status === "positive";
    if (prediction && truth) tp++;
    else if (!prediction && !truth) tn++;
    else if (prediction) fp++;
    else fn++;
  }
  const n = tp + tn + fp + fn;
  const ratio = (a: number, b: number) => b ? a / b : null;
  return { tp, tn, fp, fn, n, excluded, accuracy: ratio(tp + tn, n), sensitivity: ratio(tp, tp + fn), specificity: ratio(tn, tn + fp), precision: ratio(tp, tp + fp) };
}
