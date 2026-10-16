import { useT, localeTag, applyAppearance } from "./i18n";
import React, { lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Game from "./features/game/Game";
import GameReport from "./features/game/GameReport";
import Questionnaire from "./features/questionnaire/Questionnaire";
import QuestionnaireReport from "./features/questionnaire/QuestionnaireReport";
import Screening from "./features/screening/Screening";
import { Empty } from "./components/UI";
import "./styles/index.css";
applyAppearance();
const MRI = lazy(() => import("./features/mri/MRI"));
function App() {
  const t = useT();
  const { pathname } = useLocation();
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    const handler = () => setStorageError(true);
    window.addEventListener("neura-storage-error", handler);
    return () => window.removeEventListener("neura-storage-error", handler);
  }, []);
  return (
    <>
      {storageError && (
        <div role="alert" className="storage-alert">
          {t(
            "Не удалось сохранить данные в браузере. Не закрывайте страницу до завершения. Проверьте доступность локального хранилища.",
          )}
          <button
            onClick={() => setStorageError(false)}
            aria-label={t("Закрыть уведомление")}
          >
            ×
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/report" element={<GameReport />} />
          <Route path="/questionnaire" element={<Screening />} />
          <Route path="/questionnaire/teacher" element={<Questionnaire />} />
          <Route
            path="/questionnaire/report"
            element={<QuestionnaireReport />}
          />
          <Route
            path="/mri"
            element={
              <Suspense
                fallback={
                  <div className="loading" role="status">
                    {t("Загружаем инструменты визуализации")}
                  </div>
                }
              >
                <MRI />
              </Suspense>
            }
          />
          <Route path="/about" element={<About />} />
          <Route
            path="*"
            element={
              <Empty
                title={t("Страница не найдена")}
                text={t("Вернитесь в рабочее пространство.")}
                to="/dashboard"
                label={t("На главную")}
              />
            }
          />
        </Route>
      </Routes>
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
import "./styles/preferences.css";
