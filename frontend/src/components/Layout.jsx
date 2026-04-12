import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import OnboardingModal from "./OnboardingModal";
import { useTutorial } from "../contexts/TutorialContext";
import { DASHBOARD_STEPS } from "../lib/tutorials";

export default function Layout() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("omicafold_profile")
  );
  const { startTour } = useTutorial();

  const handleOnboardingComplete = ({ wantsTutorial }) => {
    setShowOnboarding(false);
    if (wantsTutorial) {
      setTimeout(() => startTour(DASHBOARD_STEPS), 500);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full h-full relative flex flex-col">
        <Outlet />
      </main>
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}
