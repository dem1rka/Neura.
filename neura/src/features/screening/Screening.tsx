import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardList, Download, FileUp, FlaskConical, Plus, Printer, ShieldCheck } from "lucide-react";
import { Card, Heading } from "../../components/UI";
import { usePreferences } from "../../i18n";
import { allQuestions, domains, forms, links, options, txt, type Text } from "./content";
import { analyze, demoCohort, demoMetrics, statusLabels, type ScreeningRecord } from "./engine";
import { blankRecord, download, exportCSV, exportJSON, loadRecords, MAX_BYTES, mergeRecords, parseImport, saveRecords, ScreeningImportError, validateRecord, type ImportError } from "./io";
import "./screening.css";

function useCopy() {
  const { language } = usePreferences();
  const l = (text: Text) => text[language === "kk" ? 1 : language === "en" ? 2 : 0];
  return { language, l, s: (ru: string, kk: string, en: string) => l([ru, kk, en]) };
}
const errors: Record<ImportError, Text> = {
  format: txt("Нужен корректный JSON или CSV по шаблону Neura, версия 1.", "Neura үлгісіне сай дұрыс JSON немесе CSV қажет, 1-нұсқа.", "Use valid Neura JSON or CSV, schema version 1."),
  size: txt("Размер файла не должен превышать 1 МБ.", "Файл көлемі 1 МБ-тан аспауы керек.", "The file must be no larger than 1 MB."),
  rows: txt("Допускается от 1 до 100 записей; в хранилище максимум 100.", "1–100 жазбаға рұқсат етіледі; қоймада ең көбі 100 жазба.", "Use 1–100 records; storage holds up to 100."),
  duplicate: txt("Код ребёнка повторяется. Измените код в файле; существующие записи не перезаписаны.", "Баланың коды қайталанады. Файлдағы кодты өзгертіңіз; бар жазбалар өзгертілген жоқ.", "A child code is duplicated. Change the code in the file; existing records were not overwritten."),
  fields: txt("Неизвестные поля или отсутствуют обязательные столбцы. Используйте скачанный шаблон.", "Белгісіз өрістер бар немесе міндетті бағандар жоқ. Жүктеп алынған үлгіні қолданыңыз.", "Unknown fields or missing required columns. Use the downloaded template."),
  id: txt("Код: 1–40 латинских букв, цифр, дефисов или подчёркиваний. Без ФИО.", "Код: 1–40 латын әрпі, цифр, дефис немесе астыңғы сызық. Аты-жөнін қоспаңыз.", "Code: 1–40 Latin letters, numbers, hyphens or underscores. No full names."),
  age: txt("Укажите возраст целым числом месяцев от 0 до 215.", "Жасты 0–215 аралығындағы бүтін ай санымен көрсетіңіз.", "Enter an age in whole months from 0 to 215."),
  answer: txt("Ответ должен быть 0, 1, 2, 3 или null (неизвестно).", "Жауап 0, 1, 2, 3 немесе null (белгісіз) болуы керек.", "An answer must be 0, 1, 2, 3 or null (unknown)."),
  score: txt("Проверьте баллы: M-CHAT 0–20, AQ-10 0–10. Follow-Up допустим только при 3–7 баллах и не выше первичного балла.", "Баллдарды тексеріңіз: M-CHAT 0–20, AQ-10 0–10. Follow-Up тек 3–7 баллда рұқсат етіледі және бастапқы баллдан аспайды.", "Check scores: M-CHAT 0–20, AQ-10 0–10. Follow-Up is only allowed for totals of 3–7 and cannot exceed the initial total."),
  date: txt("Нужна существующая дата в формате ГГГГ-ММ-ДД.", "ЖЖЖЖ-АА-КК пішіміндегі жарамды күн қажет.", "Use a valid date in YYYY-MM-DD format."),
  metadata: txt("Проверьте язык (ru/kk/en) и логические поля (true/false/null).", "Тілді (ru/kk/en) және логикалық өрістерді (true/false/null) тексеріңіз.", "Check language (ru/kk/en) and boolean fields (true/false/null)."),
};

export default function Screening() {
  const { language, l, s } = useCopy();
  const [query] = useSearchParams();
  const [tab, setTab] = useState<"forms" | "catalog" | "analysis">(query.has("record") ? "analysis" : "forms");
  const [records, setRecords] = useState(loadRecords);
  const [demo, setDemo] = useState(false);
  const [selected, setSelected] = useState(query.has("record") ? `local:${query.get("record")}` : "");
  const [draft, setDraft] = useState<ScreeningRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState<"social" | "wellbeing">("social");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const available = [...records.map((record) => ({ key: `local:${record.id}`, record })), ...(demo ? demoCohort.map(({ record }) => ({ key: `demo:${record.id}`, record })) : [])];
  const active = available.find((entry) => entry.key === selected)?.record ?? available[0]?.record;
  const form = forms.find((f) => f.id === formId)!;

  function reportError(e: unknown) {
    setNotice("");
    setError(e instanceof ScreeningImportError
      ? `${e.row ? `${s("Запись", "Жазба", "Record")} ${e.row}: ` : ""}${l(errors[e.code])}`
      : s("Не удалось прочитать или сохранить данные. Попробуйте ещё раз.", "Деректерді оқу немесе сақтау мүмкін болмады. Қайталап көріңіз.", "Could not read or save data. Please try again."));
  }
  function start(id: "social" | "wellbeing") {
    setDraft({ ...blankRecord(language), id: `CHILD-${Date.now().toString(36)}`, answers: {} });
    setEditingId(null); setFormId(id); setTab("forms"); setError(""); setNotice("");
  }
  function openDemo() { setDemo(true); setSelected("demo:DEMO-002"); setTab("analysis"); setError(""); setNotice(""); }
  function persist() {
    if (!draft) return;
    try {
      const record = validateRecord({ ...draft, language, demo: false });
      const next = editingId === record.id
        ? records.map((r) => r.id === record.id ? record : r)
        : mergeRecords(records, [record]);
      if (!saveRecords(next)) throw new Error("storage");
      setRecords(next); setSelected(`local:${record.id}`); setDraft(null); setTab("analysis"); setError("");
      setNotice(s("Наблюдение сохранено в этом браузере.", "Бақылау осы браузерде сақталды.", "Observation saved in this browser."));
    } catch (e) { reportError(e); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (file.size > MAX_BYTES) throw new ScreeningImportError("size");
      const incoming = parseImport(await file.text(), file.name);
      const next = mergeRecords(records, incoming);
      if (!saveRecords(next)) throw new Error("storage");
      setRecords(next); setSelected(`local:${incoming[0].id}`); setTab("analysis");
      setNotice(`${s("Загружено записей", "Жүктелген жазбалар", "Records imported")}: ${incoming.length}`);
    } catch (e) { reportError(e); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  function exportData(format: "json" | "csv", data: ScreeningRecord[], name: string) {
    download(`${name}.${format}`, format === "json" ? exportJSON(data, language) : exportCSV(data), format === "json" ? "application/json" : "text/csv;charset=utf-8");
  }
  return (
    <div className="screening">
      <Heading eyebrow={s("НАБЛЮДЕНИЯ И СКРИНИНГ", "БАҚЫЛАУ ЖӘНЕ СКРИНИНГ", "OBSERVATION AND SCREENING")}
        title={s("Анкеты и скрининг", "Сауалнамалар және скрининг", "Questionnaires and screening")}
        description={s("Два языка, понятные правила и целостный профиль наблюдений.", "Екі тіл, түсінікті ережелер және бақылаудың толық бейіні.", "Two languages, transparent rules and a connected observation profile.")}
        action={<button className="button" onClick={() => start("social")} disabled={busy}><Plus size={18} />{s("Новое наблюдение", "Жаңа бақылау", "New observation")}</button>} />

      <div className="screening-intro no-print">
        <div className="icon-tile blue"><FlaskConical size={25} /></div>
        <div><strong>{s("Попробуйте без файлов", "Файлсыз байқап көріңіз", "Try it without a file")}</strong><p>{s("8 вымышленных профилей, заполненные анкеты и расчёт демонстрационных метрик.", "8 ойдан шығарылған бейін, толтырылған сауалнамалар және көрсетілімдік метрикалар есебі.", "8 fictional profiles, completed questionnaires and calculated demonstration metrics.")}</p></div>
        <button className="button secondary" onClick={openDemo}>{s("Открыть демо", "Демоны ашу", "Open demo")}<ArrowRight size={17} /></button>
      </div>
      <div className="screening-notice"><ShieldCheck size={20} /><p>{s("Скрининг помогает выбрать следующий шаг, но не устанавливает диагноз. Авторские анкеты Neura и их переводы не валидированы. Клиническая accuracy и вероятность РАС по ним неизвестны.", "Скрининг келесі қадамды таңдауға көмектеседі, бірақ диагноз қоймайды. Neura авторлық сауалнамалары мен аудармалары валидтелмеген. Олардың клиникалық accuracy көрсеткіші және АСБ ықтималдығы белгісіз.", "Screening helps choose a next step; it does not establish a diagnosis. Neura's original questionnaires and translations are not validated. Their clinical accuracy and autism probability are unknown.")}</p></div>
      <div className="screening-tabs no-print" role="tablist" aria-label={s("Разделы анкет", "Сауалнама бөлімдері", "Questionnaire sections")}>
        {([
          ["forms", s("Заполнить анкеты", "Сауалнамаларды толтыру", "Complete questionnaires"), ClipboardList],
          ["catalog", s("Известные методики", "Танымал әдістемелер", "Established instruments"), BookOpen],
          ["analysis", s("Анализ и экспертная система", "Талдау және сараптамалық жүйе", "Analysis and expert system"), FlaskConical],
        ] as const).map(([id, label, Icon]) => <button id={`tab-${id}`} role="tab" aria-controls={`panel-${id}`} aria-selected={tab === id} key={id} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}
      </div>
      {error && <div role="alert" className="screening-error">{error}</div>}
      {notice && <p role="status" className="screening-success">{notice}</p>}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "forms" && <>
          {!draft ? <div className="screening-grid no-print">{forms.map((f, i) => <Card key={f.id} className="screening-form-card">
            <div className="screening-card-top"><span className="icon-tile teal"><ClipboardList size={24} /></span><span className="pill">RU / ҚАЗ</span></div>
            <small>NEURA · 0{i + 1} · {s("АВТОРСКАЯ АНКЕТА", "АВТОРЛЫҚ САУАЛНАМА", "ORIGINAL QUESTIONNAIRE")}</small><h2>{l(f.title)}</h2><p>{l(f.description)}</p>
            <p className="muted">{s("Родитель или педагог · последние 2 недели · без возрастных норм", "Ата-ана немесе педагог · соңғы 2 апта · жас нормаларынсыз", "Parent or teacher · past 2 weeks · no age norms")}</p>
            <button className="button secondary" onClick={() => start(f.id)}>{s("Заполнить", "Толтыру", "Complete")}<ArrowRight size={16} /></button>
          </Card>)}</div> : <Card className="screening-editor print-target">
            <div className="section-line"><div><span className="eyebrow">NEURA · {s("АВТОРСКАЯ АНКЕТА", "АВТОРЛЫҚ САУАЛНАМА", "ORIGINAL QUESTIONNAIRE")}</span><h2>{l(form.title)}</h2></div><button className="button secondary no-print" onClick={() => window.print()}><Printer size={16} />{s("Печать", "Басып шығару", "Print")}</button></div>
            <p>{s("Оцените последние 2 недели с учётом возраста, доступного способа общения и привычной среды ребёнка. «Не наблюдалось» — 0, «изредка» — 1, «часто» — 2, «почти каждый день» — 3. Если не было возможности наблюдать, выберите «не знаю». Это не стандартный тест РАС.", "Соңғы 2 аптаны баланың жасын, қолжетімді қарым-қатынас тәсілін және үйреншікті ортасын ескеріп бағалаңыз. «Байқалмады» — 0, «анда-санда» — 1, «жиі» — 2, «күн сайын дерлік» — 3. Бақылау мүмкіндігі болмаса, «білмеймін» таңдаңыз. Бұл АСБ-ға арналған стандартты тест емес.", "Consider the past 2 weeks, the child's age, communication methods and familiar environment. Not observed = 0, occasionally = 1, often = 2, almost every day = 3. If there was no opportunity to observe, select unknown. This is not a standardized autism test.")}</p>
            <div className="screening-fields">
              <label>{s("Код ребёнка (без ФИО)", "Баланың коды (аты-жөнінсіз)", "Child code (no full name)")}<input value={draft.id} maxLength={40} onChange={(e) => setDraft({ ...draft, id: e.target.value })} /></label>
              <label>{s("Возраст в месяцах", "Жасы (аймен)", "Age in months")}<input type="number" min={0} max={215} value={Number.isNaN(draft.ageMonths) ? "" : draft.ageMonths} onChange={(e) => setDraft({ ...draft, ageMonths: e.target.value === "" ? NaN : Number(e.target.value) })} /></label>
              <label>{s("Дата наблюдения", "Бақылау күні", "Observation date")}<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
            </div>
            <div className="screening-switch no-print">{forms.map((f) => <button className="button secondary" aria-pressed={formId === f.id} key={f.id} onClick={() => setFormId(f.id)}>{l(f.title)}</button>)}</div>
            {form.questions.map((q, i) => <fieldset className="screening-question" key={q.id}><legend><span>{i + 1}.</span> {l(q.text)}</legend><div className="screening-options">{options.map((option, n) => <label key={n}><input type="radio" name={q.id} value={n} checked={Object.hasOwn(draft.answers, q.id) && draft.answers[q.id] === (n === 4 ? null : n)} onChange={() => setDraft({ ...draft, answers: { ...draft.answers, [q.id]: n === 4 ? null : n as 0 | 1 | 2 | 3 } })} /><span>{l(option)}</span></label>)}</div></fieldset>)}
            <label className="screening-regression">{s("Есть ли утрата ранее освоенных навыков?", "Бұрын меңгерген дағдылардың жоғалуы бар ма?", "Have previously acquired skills been lost?")}<select value={String(draft.regression)} onChange={(e) => setDraft({ ...draft, regression: e.target.value === "null" ? null : e.target.value === "true" })}><option value="null">{s("Не знаю", "Білмеймін", "Unknown")}</option><option value="false">{s("Нет", "Жоқ", "No")}</option><option value="true">{s("Да", "Иә", "Yes")}</option></select></label>
            <ExternalScores record={draft} onChange={setDraft} />
            <div className="screening-actions no-print"><button className="button" onClick={persist} disabled={busy}>{s("Сохранить и разобрать", "Сақтау және талдау", "Save and analyse")}<ArrowRight size={17} /></button><span>{s("Пропуски сохраняются; неполные шкалы не оцениваются.", "Бос жауаптар сақталады; толық емес шкалалар бағаланбайды.", "Missing answers are saved; incomplete scales are not scored.")}</span></div>
          </Card>}
          <Card className="screening-import no-print">
            <div className="section-line"><h2>{s("Загрузить или скачать анкеты", "Сауалнамаларды жүктеу", "Import or download questionnaires")}</h2><FileUp size={23} /></div>
            <p>{s("JSON содержит тексты анкет на выбранном языке и ответы; CSV — таблицу ответов. Файлы обрабатываются в браузере. PDF и фотографии автоматически не распознаются.", "JSON таңдалған тілдегі сауалнама мәтіндері мен жауаптарды, CSV жауаптар кестесін қамтиды. Файлдар браузерде өңделеді. PDF пен фотосуреттер автоматты түрде танылмайды.", "JSON includes questionnaire text in the selected language and answers; CSV contains answer rows. Files are processed in your browser. PDFs and photos are not automatically read.")}</p>
            <input ref={fileInput} type="file" accept=".json,.csv" hidden onChange={(e) => void importFile(e.target.files?.[0])} aria-label={s("Файл с ответами", "Жауаптар файлы", "Answer file")} />
            <div className="screening-actions"><button className="button" disabled={busy} onClick={() => fileInput.current?.click()}><FileUp size={17} />{busy ? s("Загрузка…", "Жүктелуде…", "Importing…") : s("Загрузить JSON / CSV", "JSON / CSV жүктеу", "Import JSON / CSV")}</button>
              <button className="button secondary" onClick={() => exportData("json", [blankRecord(language)], `neura-template-${language}`)}><Download size={16} />{s("Бланк JSON", "JSON бланкі", "JSON template")}</button>
              <button className="button secondary" onClick={() => exportData("csv", [blankRecord(language)], `neura-template-${language}`)}>{s("Бланк CSV", "CSV бланкі", "CSV template")}</button>
              <button className="button secondary" onClick={() => exportData("json", demoCohort.map((v) => v.record), "neura-demo")}>{s("Мок-данные JSON", "Мок-деректер JSON", "Mock data JSON")}</button>
              <button className="button secondary" onClick={() => exportData("csv", demoCohort.map((v) => v.record), "neura-demo")}>{s("Мок-данные CSV", "Мок-деректер CSV", "Mock data CSV")}</button>
            </div>
            <p className="small-note">{s("До 1 МБ и 100 записей. Один код — одно наблюдение; повторные коды отклоняются. Неизвестно: null в JSON или пустая ячейка в CSV. Для нового наблюдения используйте новый код.", "1 МБ және 100 жазбаға дейін. Бір код — бір бақылау; қайталанатын кодтар қабылданбайды. Белгісіз: JSON-да null немесе CSV-де бос ұяшық. Жаңа бақылауға жаңа код қолданыңыз.", "Up to 1 MB and 100 records. One code per observation; duplicate codes are rejected. Unknown: null in JSON or a blank CSV cell. Use a new code for a new observation.")}</p>
            <Link to="/questionnaire/teacher">{s("Открыть прежнюю анкету педагога", "Бұрынғы педагог сауалнамасын ашу", "Open the previous teacher questionnaire")} →</Link>
          </Card>
        </>}
        {tab === "catalog" && <Catalog onEntry={(instrument) => {
          start("social");
          setDraft((value) => value && ({ ...value, ...(instrument === "mchat" ? { ageMonths: 24, mchat: { total: NaN } } : { ageMonths: 72, aq10: { total: NaN, noLearningDisability: null } }) }));
          setTimeout(() => document.querySelector(".screening-external")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        }} />}
        {tab === "analysis" && <>
          {active ? <>
            <div className="screening-toolbar no-print"><label>{s("Наблюдение", "Бақылау", "Observation")}<select value={available.find((v) => v.record === active)?.key} onChange={(e) => setSelected(e.target.value)}>{available.map(({ key, record }) => <option key={key} value={key}>{record.id} · {record.ageMonths} {s("мес.", "ай", "mo")} {record.demo ? "· DEMO" : ""}</option>)}</select></label>
              <div className="screening-actions"><button className="button secondary" onClick={() => exportData("json", [active], `neura-${active.id}`)}><Download size={16} />JSON</button><button className="button secondary" onClick={() => exportData("csv", [active], `neura-${active.id}`)}>CSV</button><button className="button secondary" onClick={() => window.print()}><Printer size={16} />{s("Отчёт / PDF", "Есеп / PDF", "Report / PDF")}</button></div>
            </div>
            <Report record={active} />
            {!active.demo && <button className="button secondary no-print" onClick={() => { setDraft(structuredClone(active)); setEditingId(active.id); setTab("forms"); }}>{s("Дополнить ответы", "Жауаптарды толықтыру", "Complete answers")}</button>}
          </> : <Card className="screening-empty"><ClipboardList size={36} /><h2>{s("Начните с анкеты или примера", "Сауалнамадан немесе мысалдан бастаңыз", "Start with a questionnaire or example")}</h2><button className="button" onClick={openDemo}>{s("Открыть демо", "Демоны ашу", "Open demo")}</button></Card>}
          <Metrics />
        </>}
      </div>
    </div>
  );
}

function ExternalScores({ record, onChange }: { record: ScreeningRecord; onChange: (record: ScreeningRecord) => void }) {
  const { s } = useCopy();
  const instrument = record.mchat ? "mchat" : record.aq10 ? "aq10" : "none";
  return <details className="screening-external" open={instrument !== "none" || undefined}>
    <summary>{s("Добавить результат официального бланка", "Ресми бланк нәтижесін қосу", "Add a result from an official form")}</summary>
    <p>{s("Перенесите уже подсчитанный балл оригинального бланка. Встроенные анкеты Neura не заменяют M-CHAT-R/F или AQ-10. Правильность исходного подсчёта здесь не проверяется.", "Түпнұсқа бланктен есептелген баллды енгізіңіз. Neura сауалнамалары M-CHAT-R/F немесе AQ-10-ды алмастырмайды. Бастапқы есептеудің дұрыстығы мұнда тексерілмейді.", "Enter an already calculated score from the original form. Neura questionnaires do not replace M-CHAT-R/F or AQ-10. The original scoring cannot be verified here.")}</p>
    <div className="screening-fields"><label>{s("Методика", "Әдістеме", "Instrument")}<select value={instrument} onChange={(e) => { const { mchat: _m, aq10: _a, ...rest } = record; onChange({ ...rest, ...(e.target.value === "mchat" ? { mchat: { total: NaN } } : e.target.value === "aq10" ? { aq10: { total: NaN, noLearningDisability: null } } : {}) }); }}><option value="none">{s("Не добавлять", "Қоспау", "Do not add")}</option><option value="mchat">M-CHAT-R/F</option><option value="aq10">AQ-10 Child</option></select></label>
      {record.mchat && <><label>{s("Первичный балл M-CHAT (0–20)", "M-CHAT бастапқы баллы (0–20)", "Initial M-CHAT score (0–20)")}<input type="number" min={0} max={20} value={Number.isNaN(record.mchat.total) ? "" : record.mchat.total} onChange={(e) => onChange({ ...record, mchat: { total: e.target.value === "" ? NaN : Number(e.target.value) } })} /></label>
        {record.mchat.total >= 3 && record.mchat.total <= 7 && <label>{s("Follow-Up: итоговый балл (если проведён)", "Follow-Up: қорытынды балл (өткізілсе)", "Follow-Up final score (if completed)")}<input type="number" min={0} max={record.mchat.total} value={record.mchat.followUp ?? ""} onChange={(e) => onChange({ ...record, mchat: { total: record.mchat!.total, ...(e.target.value !== "" ? { followUp: Number(e.target.value) } : {}) } })} /></label>}</>}
      {record.aq10 && <><label>{s("Балл AQ-10 (0–10)", "AQ-10 баллы (0–10)", "AQ-10 score (0–10)")}<input type="number" min={0} max={10} value={Number.isNaN(record.aq10.total) ? "" : record.aq10.total} onChange={(e) => onChange({ ...record, aq10: { ...record.aq10!, total: e.target.value === "" ? NaN : Number(e.target.value) } })} /></label><label>{s("Отсутствие интеллектуальных нарушений подтверждено?", "Зияткерлік бұзылыстардың жоқтығы расталған ба?", "Absence of learning disability confirmed?")}<select value={String(record.aq10.noLearningDisability)} onChange={(e) => onChange({ ...record, aq10: { ...record.aq10!, noLearningDisability: e.target.value === "null" ? null : e.target.value === "true" } })}><option value="null">{s("Неизвестно", "Белгісіз", "Unknown")}</option><option value="true">{s("Да", "Иә", "Yes")}</option><option value="false">{s("Нет", "Жоқ", "No")}</option></select></label></>}
    </div>
  </details>;
}

function Catalog({ onEntry }: { onEntry: (instrument: "mchat" | "aq10") => void }) {
  const { s } = useCopy();
  return <div className="screening-grid">
    <Card className="screening-catalog"><span className="pill">16–30 {s("месяцев", "ай", "months")}</span><h2>M-CHAT-R/F</h2><p>{s("Родительский скрининг для малышей: 20 пунктов и уточняющее интервью при 3–7 баллах. В этой версии Neura используется диапазон 16–30 месяцев из материалов CDC.", "Кішкентай балаларға арналған ата-ана скринингі: 20 тармақ және 3–7 баллда нақтылаушы сұхбат. Neura осы нұсқасында CDC материалдарындағы 16–30 ай аралығы қолданылады.", "Parent screening for toddlers: 20 items with follow-up at scores of 3–7. This Neura version uses the 16–30 month range from CDC training materials.")}</p><div className="screening-actions"><a href={links.mchatRu} target="_blank" rel="noreferrer">Бланк · Русский ↗</a><a href={links.mchatKk} target="_blank" rel="noreferrer">Бланк · Қазақша ↗</a></div><p className="small-note">{s("Бланки размещены на сайте авторов. Их наличие не означает отдельную валидацию каждой языковой версии. Для размещения электронной анкеты в распространяемом приложении требуется лицензия авторов.", "Бланкілер авторлар сайтында орналасқан. Бұл әр тілдік нұсқаның жеке валидтелгенін білдірмейді. Электрондық сауалнаманы таратылатын қолданбада орналастыру үшін авторлар лицензиясы қажет.", "Forms are hosted by the authors. Availability does not establish validation of each language version. Distributing the electronic questionnaire requires an authors' licence.")}</p><div className="screening-links"><a href={links.mchat} target="_blank" rel="noreferrer">{s("Условия использования", "Пайдалану шарттары", "Terms of use")} ↗</a><a href={links.scoring} target="_blank" rel="noreferrer">{s("Подсчёт", "Есептеу", "Scoring")} ↗</a><a href={links.age} target="_blank" rel="noreferrer">CDC ↗</a></div><button className="button secondary" onClick={() => onEntry("mchat")}>{s("Внести готовый результат", "Дайын нәтижені енгізу", "Enter an existing result")}</button></Card>
    <Card className="screening-catalog"><span className="pill">4–11 {s("лет", "жас", "years")}</span><h2>AQ-10 Child</h2><p>{s("Короткая родительская анкета из 10 пунктов для детей без интеллектуальных нарушений. При сумме от 6 авторы рекомендуют рассмотреть специализированную оценку.", "Зияткерлік бұзылыстары жоқ балаларға арналған 10 тармақтан тұратын қысқа ата-ана сауалнамасы. 6 баллдан бастап авторлар мамандандырылған бағалауды қарастыруды ұсынады.", "A short 10-item parent questionnaire for children without a learning disability. At a total of 6 or more, the authors suggest considering specialist assessment.")}</p><p className="small-note">{s("Оригинал — на английском. Здесь доступен ввод результата, а не перевод защищённого текста. ARC ограничивает коммерческое использование и изменение тестов без разрешения.", "Түпнұсқасы ағылшын тілінде. Мұнда қорғалған мәтіннің аудармасы емес, нәтиже енгізу қолжетімді. ARC рұқсатсыз коммерциялық қолдану мен тесттерді өзгертуге шектеу қояды.", "The original is in English. This page accepts scores; it does not translate protected questions. ARC restricts commercial use and modifications without permission.")}</p><div className="screening-links"><a href={links.aq} target="_blank" rel="noreferrer">{s("Оригинальный бланк", "Түпнұсқа бланк", "Original form")} ↗</a><a href={links.arc} target="_blank" rel="noreferrer">{s("Условия ARC", "ARC шарттары", "ARC terms")} ↗</a></div><button className="button secondary" onClick={() => onEntry("aq10")}>{s("Внести готовый результат", "Дайын нәтижені енгізу", "Enter an existing result")}</button></Card>
    <Card className="screening-catalog"><span className="pill">{s("Школьный возраст", "Мектеп жасы", "School age")}</span><h2>CAST</h2><p>{s("Известная родительская анкета для изучения аутистических особенностей у детей начальной школы. В каталоге ARC есть оригинал и переводы. Автоматический подсчёт CAST в Neura не включён.", "Бастауыш мектеп балаларының аутистік ерекшеліктерін зерттеуге арналған танымал ата-ана сауалнамасы. ARC каталогында түпнұсқа мен аудармалар бар. Neura-да CAST автоматты есебі қосылмаған.", "An established parent questionnaire examining autistic characteristics in primary school children. ARC provides the original and translations. CAST scoring is not implemented in Neura.")}</p><a href={links.cast} target="_blank" rel="noreferrer">Autism Research Centre ↗</a></Card>
    <Card className="screening-catalog"><span className="pill">{s("Метод наблюдения", "Бақылау әдісі", "Observation method")}</span><h2>{s("Наблюдение за развитием", "Дамуды бақылау", "Developmental monitoring")}</h2><p>{s("Наблюдения родителей и педагогов помогают описать развитие во времени. Стандартизированный скрининг и подробная оценка специалиста — разные этапы; одна анкета не устанавливает диагноз.", "Ата-аналар мен педагогтердің бақылаулары баланың дамуын уақыт бойынша сипаттауға көмектеседі. Стандартталған скрининг пен маманның толық бағалауы — әртүрлі кезеңдер; бір сауалнама диагноз қоймайды.", "Parent and teacher observations describe development over time. Standardized screening and a detailed professional assessment are different stages; one questionnaire does not establish a diagnosis.")}</p><a href={links.cdc} target="_blank" rel="noreferrer">CDC · {s("Скрининг и оценка", "Скрининг және бағалау", "Screening and evaluation")} ↗</a></Card>
  </div>;
}

function Report({ record }: { record: ScreeningRecord }) {
  const { s, l } = useCopy();
  const result = analyze(record);
  const flagged = result.factors.filter((f) => f.flagged);
  return <div className="screening-report print-target">
    <Card className="screening-report-head"><div><span className="eyebrow">{record.demo ? s("ВЫМЫШЛЕННЫЙ ПРИМЕР", "ОЙДАН ШЫҒАРЫЛҒАН МЫСАЛ", "FICTIONAL EXAMPLE") : s("ЛОКАЛЬНОЕ НАБЛЮДЕНИЕ", "ЖЕРГІЛІКТІ БАҚЫЛАУ", "LOCAL OBSERVATION")}</span><h2>{record.id}</h2><p>{record.ageMonths} {s("месяцев", "ай", "months")} · {record.date} · {record.language.toUpperCase()}</p></div><div><strong>{s("Мини-экспертная система", "Шағын сараптамалық жүйе", "Mini expert system")}</strong><p>{s("Правила v1 · без обученной ML-модели", "v1 ережелері · үйретілген ML моделі жоқ", "Rules v1 · no trained ML model")}</p></div></Card>
    <div className="screening-grid">{result.screens.length ? result.screens.map((screen) => <Card key={screen.instrument} className={`screening-result ${screen.status}`}><span className="eyebrow">{s("ПЕРЕНЕСЁННЫЙ РЕЗУЛЬТАТ", "ЕНГІЗІЛГЕН НӘТИЖЕ", "TRANSCRIBED RESULT")}</span><h3>{screen.instrument} <span>{screen.total}/{screen.max}</span></h3><strong>{l(statusLabels[screen.status])}</strong><p>{l(screen.explanation)}</p>{screen.instrument === "M-CHAT-R/F" && record.mchat?.followUp !== undefined && <p>Follow-Up: {record.mchat.followUp}</p>}<a href={screen.source} target="_blank" rel="noreferrer">{s("Источник правила", "Ереже дереккөзі", "Rule source")} ↗</a></Card>) : <Card><h3>{s("Стандартизированный скрининг не загружен", "Стандартталған скрининг жүктелмеген", "No standardized screening result loaded")}</h3><p>{s("Авторские наблюдения ниже не определяют наличие РАС. Для M-CHAT-R/F или AQ-10 внесите результат соответствующего оригинального бланка.", "Төмендегі авторлық бақылаулар АСБ бар-жоғын анықтамайды. M-CHAT-R/F немесе AQ-10 үшін тиісті түпнұсқа бланк нәтижесін енгізіңіз.", "The original observations below do not determine autism status. Enter a result from the appropriate official form for M-CHAT-R/F or AQ-10.")}</p></Card>}
      <Card><span className="eyebrow">{s("ГРАНИЦЫ ИНТЕРПРЕТАЦИИ", "ТҮСІНДІРУ ШЕКТЕРІ", "INTERPRETATION LIMITS")}</span><h3>{s("Вероятность РАС: не рассчитывается", "АСБ ықтималдығы: есептелмейді", "Autism probability: not calculated")}</h3><p>{s("Клиническая accuracy неизвестна: нет независимой размеченной клинической выборки. Баллы разных анкет не суммируются. Порог направления не является диагнозом.", "Клиникалық accuracy белгісіз: тәуелсіз таңбаланған клиникалық іріктеме жоқ. Әртүрлі сауалнамалардың баллдары қосылмайды. Жолдау шегі диагноз емес.", "Clinical accuracy is unknown: there is no independent labelled clinical cohort. Scores from different questionnaires are not added together. A referral threshold is not a diagnosis.")}</p></Card>
    </div>
    {result.regression && <div className="screening-alert"><strong>{s("Отмечена утрата навыков", "Дағдылардың жоғалуы белгіленді", "Loss of skills reported")}</strong><p>{s("Обсудите утрату ранее освоенных навыков с педиатром в ближайшее время независимо от баллов анкет.", "Сауалнама баллдарына қарамастан, бұрын меңгерген дағдылардың жоғалуын жақын уақытта педиатрмен талқылаңыз.", "Discuss the loss of previously acquired skills with a paediatrician promptly, regardless of questionnaire scores.")}</p></div>}
    <Card><div className="section-line"><h2>{s("Сопутствующие наблюдения", "Қосымша бақылаулар", "Associated observations")}</h2><span className="pill">NEURA</span></div><p>{s("Это области для обсуждения, а не диагнозы СДВГ, тревожного расстройства или других состояний. Балл показывается только при наличии всех ответов в области. Порог «обсудить» задан для демонстрации: средний ответ ≥ 2.", "Бұлар СДВГ, мазасыздық бұзылысы немесе басқа жағдайлардың диагноздары емес, талқылауға арналған салалар. Балл саладағы барлық жауаптар болғанда ғана көрсетіледі. «Талқылау» шегі көрсетілім үшін белгіленген: орташа жауап ≥ 2.", "These are discussion areas, not ADHD, anxiety disorder or other diagnoses. A domain is scored only when all its answers are known. The demonstration discussion threshold is an average answer ≥ 2.")}</p>
      <div className="screening-factors">{result.factors.map((factor) => <div key={factor.domain} className="screening-factor"><div><strong>{l(domains[factor.domain])}</strong><small>{factor.answered}/{factor.count} {s("ответов", "жауап", "answers")}</small></div><div className="screening-bar"><span style={{ width: factor.score === null ? 0 : `${factor.score / factor.max * 100}%` }} /></div><span>{factor.score === null ? "—" : `${factor.score}/${factor.max}`}</span><small className={factor.flagged ? "screening-flag" : ""}>{factor.score === null ? s("Недостаточно данных", "Дерек жеткіліксіз", "Insufficient data") : factor.flagged ? s("Обсудить", "Талқылау", "Discuss") : s("Ниже демо-порога", "Демо шегінен төмен", "Below demo threshold")}</small></div>)}</div>
    </Card>
    <Card><h2>{s("Почему система дала такой результат", "Жүйе неге осындай нәтиже берді", "Why the system returned this result")}</h2><ul className="screening-rules">
      {result.completion.map((c) => <li key={c.id}>{l(forms.find((f) => f.id === c.id)!.title)}: {c.answered}/{c.count}. {c.answered === c.count ? s("Все ответы известны.", "Барлық жауаптар белгілі.", "All answers are known.") : s("Неизвестные ответы не считаются нулём; полная шкала недоступна.", "Белгісіз жауаптар нөл болып саналмайды; толық шкала қолжетімсіз.", "Unknown answers are not zeros; the full scale is unavailable.")}</li>)}
      <li>{flagged.length ? `${s("Среднее ≥ 2 в областях", "Орташа мән ≥ 2 болатын салалар", "Average ≥ 2 in domains")}: ${flagged.map((f) => l(domains[f.domain])).join(", ")}.` : s("Нет полностью заполненных областей со средним ≥ 2. Это не заключение об отсутствии трудностей.", "Орташа мәні ≥ 2 болатын толық толтырылған салалар жоқ. Бұл қиындықтар жоқ деген қорытынды емес.", "No complete domain has an average ≥ 2. This does not establish an absence of difficulties.")}</li>
      <li>{s("При устойчивых трудностях обсудите конкретные примеры с педиатром или специалистом по развитию. Сохраните контекст: где, когда и какая помощь нужна ребёнку.", "Тұрақты қиындықтар болса, нақты мысалдарды педиатрмен немесе даму маманымен талқылаңыз. Мәнмәтінді сақтаңыз: балаға қайда, қашан және қандай көмек қажет.", "Discuss persistent difficulties and concrete examples with a paediatrician or developmental professional. Record where, when and what support the child needs.")}</li>
    </ul></Card>
    <Card><details><summary>{s("Все ответы", "Барлық жауаптар", "All answers")} ({allQuestions.length})</summary><div className="screening-answers">{allQuestions.map((q) => <div key={q.id}><span>{l(q.text)}</span><strong>{typeof record.answers[q.id] === "number" ? l(options[record.answers[q.id] as number]) : l(options[4])}</strong></div>)}</div></details></Card>
    <p className="small-note">{s("Отчёт не является медицинским заключением. Авторские анкеты и переводы требуют независимой проверки перед клиническим использованием.", "Есеп медициналық қорытынды емес. Авторлық сауалнамалар мен аудармалар клиникалық қолдануға дейін тәуелсіз тексеруді қажет етеді.", "This report is not a medical conclusion. Original questionnaires and translations require independent review before clinical use.")}</p>
  </div>;
}

function Metrics() {
  const { s } = useCopy();
  const metrics = demoMetrics();
  const percent = (value: number | null) => value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
  return <Card className="screening-metrics no-print"><div className="section-line"><div><span className="eyebrow">MOCK DATA · N = {metrics.n}</span><h2>{s("Accuracy на мок-данных", "Мок-деректердегі accuracy", "Accuracy on mock data")}</h2></div><FlaskConical size={26} /></div>
    <p>{s("Проверка работы интерфейса: сравниваем порог направления по внесённым M-CHAT/AQ-10 с заранее заданной вымышленной меткой РАС. Это смешанный искусственный набор из 8 случаев, не исследование точности тестов. Ваши загруженные записи в эти метрики не входят.", "Интерфейс жұмысын тексеру: енгізілген M-CHAT/AQ-10 жолдау шегін алдын ала берілген ойдан шығарылған АСБ белгісімен салыстырамыз. Бұл 8 жағдайдан тұратын аралас жасанды жиынтық, тест дәлдігін зерттеу емес. Сіз жүктеген жазбалар бұл метрикаларға кірмейді.", "Interface demonstration: referral thresholds from entered M-CHAT/AQ-10 scores are compared with predefined fictional autism labels. This mixed synthetic set of 8 cases is not a study of test accuracy. Uploaded records are excluded from these metrics.")}</p>
    <div className="screening-metric-grid">{[
      ["Accuracy", metrics.accuracy, "(TP + TN) / N"],
      [s("Чувствительность", "Сезімталдық", "Sensitivity"), metrics.sensitivity, "TP / (TP + FN)"],
      [s("Специфичность", "Ерекшелік", "Specificity"), metrics.specificity, "TN / (TN + FP)"],
      ["Precision", metrics.precision, "TP / (TP + FP)"],
    ].map(([label, value, formula]) => <div key={String(label)}><span>{label}</span><strong>{percent(value as number | null)}</strong><small>{formula}</small></div>)}</div>
    <div className="screening-confusion"><span>TP = {metrics.tp}</span><span>TN = {metrics.tn}</span><span>FP = {metrics.fp}</span><span>FN = {metrics.fn}</span></div>
    <details><summary>{s("Показать вымышленные метки и результаты", "Ойдан шығарылған белгілер мен нәтижелерді көрсету", "Show fictional labels and results")}</summary><div className="screening-table-wrap"><table><thead><tr><th>ID</th><th>{s("Методика", "Әдістеме", "Instrument")}</th><th>{s("Метка РАС (мок)", "АСБ белгісі (мок)", "Autism label (mock)")}</th><th>{s("Порог направления", "Жолдау шегі", "Referral threshold")}</th></tr></thead><tbody>{demoCohort.map(({ record, truth }) => <tr key={record.id}><td>{record.id}</td><td>{record.mchat ? "M-CHAT-R/F" : "AQ-10 Child"}</td><td>{truth ? "1" : "0"}</td><td>{analyze(record).screens[0].status === "positive" ? "1" : "0"}</td></tr>)}</tbody></table></div></details>
    <p className="small-note">{s("TP/TN — совпадения с вымышленными метками; FP/FN — несовпадения. Эти проценты нельзя переносить на реальных детей или клиническую практику.", "TP/TN — ойдан шығарылған белгілермен сәйкестік; FP/FN — сәйкессіздік. Бұл пайыздарды нақты балаларға немесе клиникалық тәжірибеге қолдануға болмайды.", "TP/TN match fictional labels; FP/FN do not. These percentages cannot be applied to real children or clinical practice.")}</p>
  </Card>;
}
