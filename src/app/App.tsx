import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminApp } from '../features/admin/AdminApp';
import { AdminLogin } from '../features/admin/AdminLogin';
import { isBlueprintPreviewAvailable } from '../features/blueprint/preview';
import { SurveyFlow } from '../features/survey/SurveyFlow';
import { isAdminAuthenticated } from '../infra/auth';

const EnergyBlueprintDemo = lazy(() =>
  import('../features/blueprint/EnergyBlueprintDemo').then((module) => ({
    default: module.EnergyBlueprintDemo,
  })),
);

function KeyboardInset() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const view = viewport;

    function sync() {
      if (!window.matchMedia('(pointer: coarse)').matches) {
        root.style.setProperty('--keyboard-inset', '0px');
        return;
      }
      const inset = Math.max(0, window.innerHeight - view.height - view.offsetTop);
      root.style.setProperty('--keyboard-inset', `${inset > 80 ? inset : 0}px`);
    }

    view.addEventListener('resize', sync);
    view.addEventListener('scroll', sync);
    window.addEventListener('orientationchange', sync);
    sync();
    return () => {
      view.removeEventListener('resize', sync);
      view.removeEventListener('scroll', sync);
      window.removeEventListener('orientationchange', sync);
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);

  return null;
}

function ProtectedAdmin() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin-login" replace />;
  }
  return <AdminApp />;
}

export default function App() {
  return (
    <>
      <KeyboardInset />
      <Analytics />
      <SpeedInsights />
      <Routes>
        <Route path="/" element={<SurveyFlow />} />
        <Route path="/embed" element={<SurveyFlow embed />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdmin />} />
        {isBlueprintPreviewAvailable() ? (
          <>
            <Route
              path="/dev/energy-blueprint"
              element={
                <Suspense fallback={null}>
                  <EnergyBlueprintDemo />
                </Suspense>
              }
            />
            <Route
              path="/preview/energy-blueprint"
              element={
                <Suspense fallback={null}>
                  <EnergyBlueprintDemo />
                </Suspense>
              }
            />
          </>
        ) : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
