import { useEffect, useRef, useState } from "react";
import {
  Upload,
  ScanLine,
  CheckCircle2,
  ArrowRight,
  Box,
  Layers,
  Workflow,
  FlaskConical,
} from "lucide-react";
import { Card, Heading, Progress, Disclaimer } from "../../components/UI";
import { service } from "../../services/storage";
const steps = [
  "Проверка демонстрационного сценария",
  "Симуляция нормализации",
  "Симуляция выделения признаков",
  "Подготовка демонстрационного отчёта",
];
export default function MRI() {
  const [filename, setFilename] = useState("");
  const [source, setSource] = useState<"example" | "local">("example");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const run = useRef(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setProgress((p) => Math.min(p + 5, 100)),
      220,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (progress === 100 && run.current) {
      run.current = false;
      setRunning(false);
      setDone(true);
      service.saveMRI({
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        source,
        simulated: true,
      });
    }
  }, [progress, source]);
  function select(file?: File) {
    if (!file) return;
    if (!/\.nii(\.gz)?$/i.test(file.name)) {
      setError(
        "Выберите файл .nii или .nii.gz. Другие форматы не поддерживаются.",
      );
      return;
    }
    setError("");
    setFilename(file.name);
    setSource("local");
    setDone(false);
    setProgress(0);
  }
  return (
    <>
      <Heading
        eyebrow="NEURA LAB · ИССЛЕДОВАТЕЛЬСКИЙ МОДУЛЬ"
        title="Исследовать возможности. Честно."
        description="Концепция будущего МРТ-модуля — от изображения к исследовательским признакам."
      />
      <div className="lab-notice">
        <FlaskConical size={21} />
        <div>
          <strong>Это симуляция. Обученной модели нет.</strong>
          <p>
            Файлы не читаются, не сохраняются и никуда не отправляются.
            Результат не зависит от выбранного файла.
          </p>
        </div>
        <span className="pill">EXPERIMENTAL</span>
      </div>
      <div className="mri-grid">
        <Card>
          <div className="section-line">
            <h2>01 / Исходный материал</h2>
            <ScanLine size={20} />
          </div>
          <div
            className={"dropzone " + (drag ? "drag" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              if (!running) setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!running) select(e.dataTransfer.files[0]);
            }}
          >
            <Upload size={32} />
            <h3>{filename || "Перетащите файл сюда"}</h3>
            <p>NIfTI · .nii или .nii.gz</p>
            <button
              className="button secondary"
              disabled={running}
              onClick={() => input.current?.click()}
            >
              Выбрать файл
            </button>
            <input
              ref={input}
              type="file"
              accept=".nii,.gz"
              aria-label="Выберите МРТ-файл"
              hidden
              onChange={(e) => select(e.target.files?.[0])}
            />
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="or-line">или используйте готовый пример</div>
          <button
            className={
              "example-file " +
              (filename && source === "example" ? "chosen" : "")
            }
            disabled={running}
            onClick={() => {
              setFilename("neura_demo_volume.nii.gz");
              setSource("example");
              setError("");
              setDone(false);
              setProgress(0);
            }}
          >
            <span className="icon-tile purple">
              <Layers />
            </span>
            <span>
              <strong>Демонстрационный объём</strong>
              <small>Синтетический пример · без данных пациента</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <p className="small-note">
            Локально хранится только факт завершения симуляции. Имя и содержимое
            выбранного файла не сохраняются.
          </p>
          <button
            className="button full"
            disabled={!filename || running}
            onClick={() => {
              setProgress(0);
              setRunning(true);
              setDone(false);
              run.current = true;
            }}
          >
            {running
              ? "Выполняется симуляция…"
              : done
                ? "Повторить симуляцию"
                : "Запустить симуляцию"}
            <ArrowRight size={18} />
          </button>
        </Card>
        <Card className="mri-preview">
          <div className="section-line">
            <h2>Схематичный демо-срез</h2>
            <span className="pill">SVG · НЕ МРТ</span>
          </div>
          <svg
            viewBox="0 0 400 290"
            role="img"
            aria-label="Синтетическая абстрактная схема среза, не медицинский снимок"
          >
            <defs>
              <radialGradient id="slice">
                <stop stopColor="#b1bfd2" />
                <stop offset="1" stopColor="#46576f" />
              </radialGradient>
            </defs>
            <g stroke="#344354" strokeWidth=".7" opacity=".4">
              {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d={`M${i * 36} 0V290M0 ${i * 29}H400`} />
              ))}
            </g>
            <ellipse
              cx="200"
              cy="145"
              rx="101"
              ry="123"
              fill="none"
              stroke="#6d829b"
              strokeWidth="5"
            />
            <ellipse cx="200" cy="145" rx="92" ry="113" fill="url(#slice)" />
            {Array.from({ length: 8 }, (_, i) => (
              <g
                key={i}
                fill="none"
                stroke={i % 2 ? "#435570" : "#c0cbdb"}
                strokeWidth="5"
              >
                <path
                  d={`M190 ${50 + i * 24}Q${100 + i * 5} ${20 + i * 28} ${121 + (i % 3) * 12} ${85 + i * 22}Q165 ${70 + i * 25} 190 ${88 + i * 21}`}
                />
                <path
                  d={`M210 ${50 + i * 24}Q${300 - i * 5} ${20 + i * 28} ${279 - (i % 3) * 12} ${85 + i * 22}Q235 ${70 + i * 25} 210 ${88 + i * 21}`}
                />
              </g>
            ))}
            <path d="M200 35v220" stroke="#24354c" strokeWidth="4" />
            <path
              d="M185 125q-25 25 0 45l15-17 15 17q25-20 0-45l-15 18Z"
              fill="#233449"
            />
            <path
              d="M60 145h280M200 10v270"
              stroke="#67b7c8"
              strokeWidth=".7"
              strokeDasharray="5 5"
            />
          </svg>
          <div className="preview-label">
            <span>AXIAL / ILLUSTRATION</span>
            <span>DEMO ONLY</span>
          </div>
          <p>
            Авторская иллюстрация для демонстрации интерфейса. Не отображает
            выбранный файл.
          </p>
        </Card>
      </div>
      <Card className="pipeline">
        <div className="section-line">
          <h2>02 / Исследовательский процесс</h2>
          <span className="muted">{progress}%</span>
        </div>
        <Progress value={progress} />
        <div className="pipeline-steps">
          {steps.map((step, i) => (
            <div
              key={step}
              className={progress >= (i + 1) * 25 ? "complete" : ""}
            >
              {progress >= (i + 1) * 25 ? (
                <CheckCircle2 />
              ) : i === 0 ? (
                <Box />
              ) : i === 1 ? (
                <Layers />
              ) : (
                <Workflow />
              )}
              <span>0{i + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <p role="status" className="small-note">
          {running
            ? steps[Math.min(3, Math.floor(progress / 25))]
            : done
              ? "Демонстрационный процесс завершён."
              : "Выберите пример или файл для запуска."}
        </p>
      </Card>
      {done && (
        <Card className="simulation-result">
          <CheckCircle2 />
          <h2>Сценарий завершён</h2>
          <p>
            Показаны этапы предполагаемого исследовательского процесса. Реальная
            предобработка, извлечение признаков и медицинский анализ не
            выполнялись.
          </p>
          <div className="result-tags">
            <span>Режим: симуляция</span>
            <span>Модель: не подключена</span>
            <span>Диагностический вывод: отсутствует</span>
          </div>
        </Card>
      )}
      <Card>
        <h2>Что планируется исследовать</h2>
        <p>
          Возможный стек: Python, PyTorch, MONAI и свёрточные нейронные сети
          (CNN). ABIDE рассматривается как возможный исследовательский набор
          данных. Архитектура и протокол исследования ещё не определены.
        </p>
        <p className="small-note">
          Будущий модуль потребует проверки качества данных, независимой
          валидации, оценки смещений и этического согласования. Прототип не
          заявляет клиническую точность и не рассчитывает вероятность РАС.
        </p>
      </Card>
      <Disclaimer />
    </>
  );
}
