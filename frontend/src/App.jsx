import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./lib/firebase"; // <-- Instancia Firebase Client globalmente
import { TutorialProvider } from "./contexts/TutorialContext";
import TutorialOverlay from "./components/TutorialOverlay";
import Layout from "./components/Layout";
import Viewer from "./pages/Viewer";
import SubmitFasta from "./pages/SubmitFasta";
import JobsList from "./pages/JobsList";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import RAGAssistant from "./pages/RAGAssistant";
import Labs from "./pages/Labs";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";

function App() {
  return (
    <TutorialProvider>
      <TutorialOverlay />
    <BrowserRouter>
      <Routes>
        {/* Pórtico comercial bloqueador */}
        <Route path="/" element={<Landing />} />

        {/* Zona de trabajo científica */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Viewer />} />
          <Route path="submit" element={<SubmitFasta />} />
          <Route path="jobs" element={<JobsList />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="assistant" element={<RAGAssistant />} />
          <Route path="labs" element={<Labs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </TutorialProvider>
  );
}

export default App;
