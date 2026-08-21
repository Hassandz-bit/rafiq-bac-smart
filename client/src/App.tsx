import { Toaster } from "@/components/ui/sonner";
import React, { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FreeDiagnostic from "./pages/FreeDiagnostic";
import HassemDiagnostic from "./pages/HassemDiagnostic";

const AssessmentLab = lazy(() => import("./pages/AssessmentLab"));
const BacPage = lazy(() => import("./pages/BacPage"));
const LearningLab = lazy(() => import("./pages/LearningLab"));
const HassemPage = lazy(() => import("./pages/HassemPage"));
const StudentHome = lazy(() => import("./pages/StudentHome"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const AdminPage = lazy(async () => ({ default: (await import("./pages/StaffPages")).AdminPage }));
const EditorPage = lazy(async () => ({ default: (await import("./pages/StaffPages")).EditorPage }));
const ReviewerPage = lazy(async () => ({ default: (await import("./pages/StaffPages")).ReviewerPage }));

function RouteLoadingFallback() {
  return <main dir="rtl" className="flex min-h-screen w-full items-center justify-center bg-[#f7f9ff] px-5 text-slate-800"><div role="status" aria-live="polite" className="rounded-2xl border border-blue-100 bg-white px-6 py-5 text-center shadow-lg shadow-blue-100/40"><p className="text-sm font-black text-blue-900">جارٍ تجهيز مساحة التعلّم…</p><p className="mt-1 text-xs text-slate-500">يُحمّل المسار المطلوب فقط للحفاظ على سرعة البداية.</p></div></main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/diagnostic"} component={FreeDiagnostic} />
      <Route path={"/hassem/diagnostic"} component={HassemDiagnostic} />
      <Route path={"/hassem"} component={HassemPage} />
      <Route path={"/app"} component={StudentHome} />
      <Route path={"/student"} component={StudentHome} />
      <Route path={"/subjects"} component={SubjectsPage} />
      <Route path={"/lab"} component={LearningLab} />
      <Route path={"/assessment"} component={AssessmentLab} />
      <Route path={"/bac"} component={BacPage} />
      <Route path={"/studio"} component={StudioPage} />
      <Route path={"/editor"} component={EditorPage} />
      <Route path={"/review"} component={ReviewerPage} />
      <Route path={"/admin"} component={AdminPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
