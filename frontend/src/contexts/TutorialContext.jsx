import { createContext, useContext, useState, useCallback } from "react";

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [steps,     setSteps]     = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = useCallback((tourSteps) => {
    setStepIndex(0);
    setSteps(tourSteps);
  }, []);

  const endTour = useCallback(() => setSteps(null), []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i < (steps?.length ?? 1) - 1) return i + 1;
      setSteps(null);
      return 0;
    });
  }, [steps]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  return (
    <TutorialContext.Provider value={{ steps, stepIndex, startTour, endTour, next, prev }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
