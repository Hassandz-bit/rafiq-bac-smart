import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AssessmentLab from "./pages/AssessmentLab";
import BacPage from "./pages/BacPage";
import LearningLab from "./pages/LearningLab";
import FreeDiagnostic from "./pages/FreeDiagnostic";
import HassemPage from "./pages/HassemPage";
import HassemDiagnostic from "./pages/HassemDiagnostic";
import StudentHome from "./pages/StudentHome";
import StudioPage from "./pages/StudioPage";
import SubjectsPage from "./pages/SubjectsPage";
import { AdminPage, EditorPage, ReviewerPage } from "./pages/StaffPages";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
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
