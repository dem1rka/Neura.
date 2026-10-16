import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Crosshair,
  Database,
  FileImage,
  Files,
  Play,
  Layers,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  TableProperties,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { Card, Heading } from "../../components/UI";
import { localeTag, useT } from "../../i18n";
import { service } from "../../services/storage";
import { collectMRIFiles, createMRIId, type MRIEntry } from "./files";
import { demoSizeMB, loadDemoScan } from "./demo";
import {
  getDiagnosis,
  getSex,
  normalizeRecord,
  normalizeSubjectId,
  type PhenotypicRecord,
} from "./phenotypic";
import {
  defaultAppearance,
  useMRIViewer,
  type ViewerMode,
} from "./useMRIViewer";
import "./mri.css";

function Field({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

export default function MRI() {
  const t = useT();
  const mriInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const csvToken = useRef(0);
  const recorded = useRef(new Set<string>());
  const demoRequest = useRef<AbortController | null>(null);
  const viewerSection = useRef<HTMLDivElement>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const [entries, setEntries] = useState<MRIEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewerMode>("multiplanar");
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState<string[]>([]);
  const [csvError, setCsvError] = useState("");
  const [csvWarnings, setCsvWarnings] = useState(0);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csv, setCsv] = useState<{
    name: string;
    index: Map<string, PhenotypicRecord>;
  } | null>(null);
  const active = entries.find((entry) => entry.id === activeId);
  const viewer = useMRIViewer(active?.file, mode, appearance);
  const phenotype = csv?.index.get(normalizeSubjectId(active?.subjectId));
  const group = getDiagnosis(phenotype);
  const sex = getSex(phenotype);
  const metadata = viewer.metadata;
  const modes = [
    { value: "axial", label: t("Аксиальный"), short: "Axial", icon: Layers },
    {
      value: "sagittal",
      label: t("Сагиттальный"),
      short: "Sagittal",
      icon: Layers,
    },
    {
      value: "coronal",
      label: t("Корональный"),
      short: "Coronal",
      icon: ScanLine,
    },
    {
      value: "multiplanar",
      label: t("Три плоскости"),
      short: "MPR",
      icon: Crosshair,
    },
    { value: "render", label: t("Объёмный просмотр"), short: "3D", icon: Box },
  ] as const;

  useEffect(
    () => () => {
      csvToken.current += 1;
      demoRequest.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (
      !active ||
      viewer.loaded?.file !== active.file ||
      recorded.current.has(active.id)
    )
      return;
    recorded.current.add(active.id);
    service.saveMRI({
      id: active.id,
      completedAt: new Date().toISOString(),
      source: active.source,
      simulated: false,
    });
  }, [active, viewer.loaded]);

  function showViewer() {
    viewerSection.current?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }

  async function openDemo() {
    if (demoRequest.current) return;
    setDemoError(false);
    const existing = entries.find((entry) => entry.source === "example");
    if (existing) {
      setActiveId(existing.id);
      if (existing.id === activeId && viewer.loadError) viewer.retry();
      showViewer();
      return;
    }
    const request = new AbortController();
    demoRequest.current = request;
    setDemoLoading(true);
    try {
      const file = await loadDemoScan(request.signal);
      if (request.signal.aborted) return;
      const entry: MRIEntry = {
        id: createMRIId(),
        file,
        subjectId: "",
        source: "example",
      };
      setEntries((current) => [...current, entry]);
      setActiveId(entry.id);
      showViewer();
    } catch {
      if (!request.signal.aborted) setDemoError(true);
    } finally {
      if (!request.signal.aborted) {
        demoRequest.current = null;
        setDemoLoading(false);
      }
    }
  }

  function addFiles(files: FileList | File[]) {
    const { added, rejected } = collectMRIFiles(entries, Array.from(files));
    setFileError(rejected);
    setEntries((current) => [...current, ...added]);
    if (!activeId && added.length) setActiveId(added[0].id);
  }
  function removeEntry(id: string) {
    const index = entries.findIndex((entry) => entry.id === id);
    const next = entries.filter((entry) => entry.id !== id);
    setEntries(next);
    if (id === activeId)
      setActiveId(next[Math.min(index, next.length - 1)]?.id ?? null);
  }
  function loadCsv(file?: File) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) || !file.size) {
      setCsvError("Выберите непустой CSV-файл ABIDE I.");
      return;
    }
    const token = ++csvToken.current;
    setCsvLoading(true);
    setCsvError("");
    setCsvWarnings(0);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) =>
        header
          .replace(/^\uFEFF/, "")
          .trim()
          .toUpperCase(),
      complete: (result) => {
        if (token !== csvToken.current) return;
        setCsvLoading(false);
        if (!result.meta.fields?.includes("SUB_ID")) {
          setCsvError("В CSV не найден обязательный столбец SUB_ID.");
          return;
        }
        const index = new Map<string, PhenotypicRecord>();
        for (const row of result.data) {
          const record = normalizeRecord(row);
          const id = normalizeSubjectId(record.SUB_ID);
          if (id) index.set(id, record);
        }
        if (!index.size) {
          setCsvError("В CSV нет записей с SUB_ID.");
          return;
        }
        setCsv({ name: file.name, index });
        setCsvWarnings(result.errors.length);
      },
      error: () => {
        if (token !== csvToken.current) return;
        setCsvLoading(false);
        setCsvError("Не удалось прочитать CSV-файл.");
      },
    });
  }

  return (
    <div className="mri-workspace">
      <Heading
        eyebrow={t("NEURA LAB · ИССЛЕДОВАТЕЛЬСКИЙ МОДУЛЬ")}
        title={t("МРТ. От целого к деталям.")}
        description={t(
          "Откройте NIfTI-снимок, исследуйте срезы и сопоставьте данные ABIDE в одном пространстве.",
        )}
        action={
          <button className="button" onClick={() => mriInput.current?.click()}>
            <Upload size={17} />
            {t("Добавить МРТ")}
          </button>
        }
      />

      <div className="mri-demo-banner">
        <span className="icon-tile purple">
          <ScanLine size={24} />
        </span>
        <div className="mri-demo-copy">
          <strong>{t("Нет снимка под рукой? Начните с демо.")}</strong>
          <p>
            {t(
              "Встроенный снимок MPRAGE: все срезы, 3D и настройки доступны без своего файла.",
            )}
          </p>
          <small>
            {t("Без потери качества · {0} МБ", {
              0: demoSizeMB.toLocaleString(localeTag(), {
                maximumFractionDigits: 1,
              }),
            })}
          </small>
        </div>
        <button
          className="button"
          disabled={demoLoading}
          onClick={() => void openDemo()}
        >
          {demoLoading ? (
            <LoaderCircle className="mri-spin" size={17} />
          ) : (
            <Play size={17} />
          )}
          {demoLoading ? t("Загружаем демо…") : t("Открыть демо")}
        </button>
        {demoError && (
          <p className="mri-demo-error error" role="alert">
            {t(
              "Не удалось загрузить демо. Проверьте соединение и нажмите «Открыть демо» ещё раз.",
            )}
          </p>
        )}
      </div>

      <div className="mri-notice">
        <span className="icon-tile teal">
          <ShieldCheck size={22} />
        </span>
        <div>
          <strong>{t("Ваши файлы остаются в браузере")}</strong>
          <p>
            {t(
              "Просмотр реальных снимков без загрузки на сервер. Файлы и CSV доступны до ухода со страницы.",
            )}
          </p>
        </div>
        <span className="pill">NIfTI · 2D / 3D</span>
      </div>

      {!!fileError.length && (
        <div className="mri-alert error" role="alert">
          <AlertCircle size={18} />
          <span>
            {t("Пропущены неподдерживаемые или пустые файлы: {0}", {
              0: fileError.join(", "),
            })}
          </span>
          <button
            className="icon-button"
            aria-label={t("Закрыть уведомление")}
            onClick={() => setFileError([])}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="mri-layout">
        <div className="mri-sidebar">
          <Card>
            <div className="section-line">
              <h2>{t("Исследования")}</h2>
              <Files size={19} />
            </div>
            <p className="mri-caption">
              {t("Загружено: {0}", { 0: entries.length })}
            </p>
            <input
              ref={mriInput}
              type="file"
              accept=".nii,.nii.gz"
              multiple
              hidden
              aria-label={t("Выберите МРТ-файлы")}
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              className={"mri-dropzone " + (drag ? "drag" : "")}
              onClick={() => mriInput.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDrag(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setDrag(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDrag(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              <span className="icon-tile blue">
                <Upload size={23} />
              </span>
              <strong>{t("Перетащите снимки сюда")}</strong>
              <span>{t("или нажмите, чтобы выбрать")}</span>
              <small>.nii · .nii.gz</small>
            </button>
            {entries.length ? (
              <ul className="mri-file-list">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={entry.id === activeId ? "selected" : ""}
                  >
                    <button
                      aria-pressed={entry.id === activeId}
                      onClick={() => setActiveId(entry.id)}
                      title={entry.file.name}
                    >
                      <FileImage size={19} />
                      <span>
                        <strong>{entry.file.name}</strong>
                        <small>
                          {(entry.file.size / 1048576).toLocaleString(
                            localeTag(),
                            { maximumFractionDigits: 2 },
                          )}{" "}
                          MB ·{" "}
                          {entry.source === "example"
                            ? t("Демо-снимок")
                            : entry.subjectId || t("Без SUB_ID")}
                        </small>
                      </span>
                    </button>
                    <button
                      className="mri-remove"
                      aria-label={t("Убрать файл {0}", { 0: entry.file.name })}
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small-note">
                {t(
                  "Можно добавить несколько исследований и переключаться между ними.",
                )}
              </p>
            )}
          </Card>

          <Card>
            <div className="section-line">
              <h2>{t("Данные ABIDE")}</h2>
              <Database size={19} />
            </div>
            <p className="mri-caption">{t("Сопоставление по SUB_ID")}</p>
            <input
              ref={csvInput}
              type="file"
              accept=".csv"
              hidden
              aria-label={t("Выберите CSV-файл")}
              onChange={(event) => {
                loadCsv(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {csv && (
              <div className="mri-csv-summary">
                <CheckCircle2 size={18} />
                <div>
                  <strong title={csv.name}>{csv.name}</strong>
                  <small>
                    {t("Записей: {0}", {
                      0: csv.index.size.toLocaleString(localeTag()),
                    })}
                  </small>
                </div>
                <button
                  className="icon-button"
                  aria-label={t("Убрать CSV")}
                  onClick={() => {
                    csvToken.current++;
                    setCsv(null);
                    setCsvError("");
                    setCsvWarnings(0);
                    setCsvLoading(false);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <button
              className="button secondary full"
              disabled={csvLoading}
              onClick={() => csvInput.current?.click()}
            >
              <Upload size={16} />
              {csvLoading
                ? t("Читаем CSV…")
                : csv
                  ? t("Заменить CSV")
                  : t("Загрузить CSV")}
            </button>
            <p className="small-note">
              {t(
                "Phenotypic_V1_0b_preprocessed.csv или CSV со столбцом SUB_ID.",
              )}
            </p>
            {csvError && (
              <p className="error small-note" role="alert">
                {t(csvError)}
              </p>
            )}
            {csvWarnings > 0 && (
              <p className="small-note" role="status">
                {t(
                  "CSV загружен с предупреждениями: {0}. Проверьте строки исходного файла.",
                  { 0: csvWarnings },
                )}
              </p>
            )}
            <div className="mri-participant">
              <div className="section-line">
                <h3>{t("Участник")}</h3>
                {group && <span className="pill">{group}</span>}
              </div>
              <label className="mri-field" htmlFor="mri-subject">
                <span>SUB_ID</span>
                <input
                  id="mri-subject"
                  value={active?.subjectId ?? ""}
                  disabled={!active}
                  placeholder="0051456"
                  onChange={(event) =>
                    setEntries((current) =>
                      current.map((entry) =>
                        entry.id === activeId
                          ? { ...entry, subjectId: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
              </label>
              <dl className="mri-fields">
                <Field label={t("Группа из CSV")}>{group}</Field>
                <Field label={t("Возраст")}>
                  {phenotype?.AGE_AT_SCAN || phenotype?.AGE}
                </Field>
                <Field label={t("Пол")}>{sex ? t(sex) : null}</Field>
                <Field label={t("Центр")}>
                  {phenotype?.SITE_ID || phenotype?.SITE}
                </Field>
              </dl>
              <p className="small-note">
                {csv && active && !phenotype
                  ? t(
                      "Совпадение не найдено. Проверьте SUB_ID или измените его вручную.",
                    )
                  : t(
                      "Группа берётся из CSV и не является результатом анализа снимка.",
                    )}
              </p>
            </div>
          </Card>
        </div>

        <div className="mri-content" ref={viewerSection}>
          <Card className="mri-viewer-card">
            <div className="mri-viewer-heading">
              <span className="icon-tile purple">
                <ScanLine size={21} />
              </span>
              <div>
                <h2 title={active?.file.name}>
                  {active?.file.name ?? t("Пространство просмотра")}
                </h2>
                <p>
                  {metadata
                    ? `${metadata.dimensions.join(" × ")} · ${metadata.orientation}`
                    : t("Исследуйте изображение в удобной проекции")}
                </p>
              </div>
              <span className="pill">
                {active?.source === "example" ? t("ДЕМО") : t("ЛОКАЛЬНО")}
              </span>
            </div>
            <div
              className="mri-modes"
              role="group"
              aria-label={t("Режим просмотра")}
            >
              {modes.map(({ value, label, short, icon: Icon }) => (
                <button
                  key={value}
                  title={label}
                  aria-label={label}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  <Icon size={16} />
                  {short}
                </button>
              ))}
            </div>
            <div
              className="mri-viewport"
              aria-busy={
                viewer.loading || (!viewer.ready && !viewer.initializationError)
              }
            >
              <div ref={viewer.hostRef} className="mri-canvas-host" />
              {(!metadata || viewer.loading) && (
                <div
                  className="mri-viewer-overlay"
                  role={
                    viewer.initializationError || viewer.loadError
                      ? "alert"
                      : "status"
                  }
                >
                  <span className="mri-empty-icon">
                    {viewer.initializationError || viewer.loadError ? (
                      <AlertCircle size={30} />
                    ) : viewer.loading || !viewer.ready ? (
                      <LoaderCircle className="mri-spin" size={30} />
                    ) : (
                      <ScanLine size={32} />
                    )}
                  </span>
                  <h3>
                    {viewer.initializationError
                      ? t("Просмотр недоступен")
                      : viewer.loadError
                        ? t("Не удалось открыть снимок")
                        : viewer.loading
                          ? t("Читаем NIfTI-снимок…")
                          : !viewer.ready
                            ? t("Подготавливаем просмотр…")
                            : t("Каждая деталь — часть целого")}
                  </h3>
                  <p>
                    {viewer.initializationError
                      ? t(
                          "Нужен браузер с WebGL2. Проверьте аппаратное ускорение и повторите попытку.",
                        )
                      : viewer.loadError
                        ? t(
                            "Файл повреждён или не является NIfTI. Выберите другой снимок либо повторите попытку.",
                          )
                        : viewer.loading
                          ? active?.file.name
                          : !viewer.ready
                            ? t("Загружаем инструменты визуализации")
                            : t(
                                "Откройте встроенное демо или добавьте свой .nii / .nii.gz.",
                              )}
                  </p>
                  {viewer.initializationError || viewer.loadError ? (
                    <button className="button secondary" onClick={viewer.retry}>
                      <RotateCcw size={16} />
                      {t("Повторить попытку")}
                    </button>
                  ) : (
                    viewer.ready &&
                    !active && (
                      <div className="mri-empty-actions">
                        <button
                          className="button"
                          disabled={demoLoading}
                          onClick={() => void openDemo()}
                        >
                          {demoLoading ? (
                            <LoaderCircle className="mri-spin" size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                          {demoLoading
                            ? t("Загружаем демо…")
                            : t("Посмотреть демо")}
                        </button>
                        <button
                          className="button secondary"
                          onClick={() => mriInput.current?.click()}
                        >
                          <Upload size={16} />
                          {t("Выбрать снимок")}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <p className="mri-viewer-hint">
              <span className="mri-touch-hint">
                {t(
                  "Коснитесь среза для перекрестия. Меняйте срезы ползунками; в 3D вращайте объём пальцем.",
                )}
              </span>
              <span className="mri-mouse-hint">
                {mode === "render"
                  ? t("Перетаскивание — вращение объёма · колесо — масштаб")
                  : t(
                      "Колесо — срез · левая кнопка — перекрестие · правая кнопка — окно интенсивности",
                    )}
              </span>
            </p>
            <div className="mri-slices">
              {["X", "Y", "Z"].map((axis, index) => (
                <label key={axis}>
                  <span>
                    <strong>{axis}</strong>
                    <output>
                      {viewer.position[index]} /{" "}
                      {Math.max(0, viewer.dimensions[index] - 1)}
                    </output>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, viewer.dimensions[index] - 1)}
                    step={1}
                    value={viewer.position[index]}
                    disabled={
                      !metadata ||
                      viewer.loading ||
                      viewer.dimensions[index] <= 1
                    }
                    aria-label={t("Срез {0}", { 0: axis })}
                    onChange={(event) =>
                      viewer.setSlice(index, Number(event.target.value))
                    }
                  />
                </label>
              ))}
            </div>
          </Card>

          <div className="mri-details">
            <Card>
              <div className="section-line">
                <h2>{t("Визуализация")}</h2>
                <SlidersHorizontal size={19} />
              </div>
              <div className="mri-adjustments">
                <label htmlFor="mri-brightness">
                  <span>
                    {t("Яркость")}
                    <output>{appearance.brightness}</output>
                  </span>
                  <input
                    id="mri-brightness"
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={appearance.brightness}
                    disabled={!metadata}
                    onChange={(event) =>
                      setAppearance({
                        ...appearance,
                        brightness: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label htmlFor="mri-contrast">
                  <span>
                    {t("Контраст")}
                    <output>×{appearance.contrast.toFixed(2)}</output>
                  </span>
                  <input
                    id="mri-contrast"
                    type="range"
                    min={0.25}
                    max={4}
                    step={0.05}
                    value={appearance.contrast}
                    disabled={!metadata}
                    onChange={(event) =>
                      setAppearance({
                        ...appearance,
                        contrast: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="mri-field">
                  <span>{t("Цветовая схема")}</span>
                  <select
                    value={appearance.colormap}
                    disabled={!metadata}
                    onChange={(event) =>
                      setAppearance({
                        ...appearance,
                        colormap: event.target.value,
                      })
                    }
                  >
                    {["gray", "bone", "hot", "viridis", "plasma", "winter"].map(
                      (value) => (
                        <option key={value} value={value}>
                          {value === "gray"
                            ? t("Оттенки серого")
                            : value.charAt(0).toUpperCase() + value.slice(1)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <button
                  className="button secondary full"
                  disabled={!metadata}
                  onClick={() => setAppearance({ ...defaultAppearance })}
                >
                  <RotateCcw size={15} />
                  {t("Сбросить настройки")}
                </button>
              </div>
            </Card>
            <Card>
              <div className="section-line">
                <h2>{t("Метаданные")}</h2>
                <TableProperties size={19} />
              </div>
              {metadata ? (
                <>
                  <dl className="mri-fields">
                    <Field label={t("Размеры")}>
                      {metadata.dimensions.join(" × ")}
                    </Field>
                    <Field label={t("Размер вокселя")}>
                      {metadata.voxelSpacing
                        .map((value) =>
                          value.toLocaleString(localeTag(), {
                            maximumFractionDigits: 3,
                          }),
                        )
                        .join(" × ")}{" "}
                      {metadata.spatialUnit}
                    </Field>
                    <Field label={t("Ориентация")}>
                      {metadata.orientation}
                    </Field>
                    <Field label={t("Тип данных")}>{metadata.datatype}</Field>
                  </dl>
                  <details className="mri-affine">
                    <summary>{t("Аффинная матрица 4 × 4")}</summary>
                    <div className="mri-matrix">
                      {metadata.affine.map((row, index) => (
                        <div key={index}>
                          {row.map((value, column) => (
                            <span key={column}>{value.toFixed(3)}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              ) : (
                <div className="mri-metadata-empty">
                  <TableProperties size={28} />
                  <p>
                    {t(
                      "Размеры, ориентация и параметры вокселей появятся после открытия снимка.",
                    )}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <div className="disclaimer">
        <ShieldCheck size={20} />
        <p>
          <strong>
            {t("Исследовательский просмотр. Ответственная интерпретация.")}
          </strong>{" "}
          {t(
            "Модуль отображает снимки и данные CSV. Автоматическая диагностика и классификация не выполняются.",
          )}
        </p>
      </div>
    </div>
  );
}
