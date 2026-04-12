import { useEffect, useState, useCallback } from "react";
import { useTutorial } from "../contexts/TutorialContext";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const PADDING = 10; // px around the spotlight

function getRect(target) {
  if (!target) return null;
  const el = document.querySelector(target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top:    r.top    - PADDING,
    left:   r.left   - PADDING,
    width:  r.width  + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function tooltipPosition(rect, side) {
  if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  const GAP = 18;
  switch (side) {
    case "right":  return { top: rect.top, left: rect.left + rect.width + GAP };
    case "left":   return { top: rect.top, left: rect.left - GAP, transform: "translateX(-100%)" };
    case "bottom": return { top: rect.top + rect.height + GAP, left: rect.left };
    case "top":    return { top: rect.top - GAP, left: rect.left, transform: "translateY(-100%)" };
    default:       return { top: rect.top, left: rect.left + rect.width + GAP };
  }
}

export default function TutorialOverlay() {
  const { steps, stepIndex, endTour, next, prev } = useTutorial();
  const [rect,    setRect]    = useState(null);
  const [visible, setVisible] = useState(false);

  const step = steps?.[stepIndex];
  const isIntro = !step?.target;
  const isLast  = stepIndex === (steps?.length ?? 1) - 1;

  // Measure target element
  const measure = useCallback(() => {
    if (!step?.target) { setRect(null); return; }
    const r = getRect(step.target);
    setRect(r);
  }, [step]);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      measure();
      setVisible(true);
    }, 80);
    return () => clearTimeout(t);
  }, [stepIndex, measure]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape")      endTour();
      if (e.key === "ArrowRight")  next();
      if (e.key === "ArrowLeft")   prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [endTour, next, prev]);

  if (!steps || !step) return null;

  const tooltipPos = tooltipPosition(rect, step.side ?? "right");

  return (
    <div className="fixed inset-0 z-[9998]" aria-modal="true">

      {/* ── Overlay oscuro (excepto spotlight) ── */}
      {!isIntro && rect ? (
        // Spotlight: caja sobre el elemento con box-shadow que oscurece el resto
        <div
          style={{
            position: "fixed",
            top:    rect.top,
            left:   rect.left,
            width:  rect.width,
            height: rect.height,
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.68)",
            transition: "top 300ms ease, left 300ms ease, width 300ms ease, height 300ms ease",
            zIndex: 9998,
            pointerEvents: "none",
            outline: "2px solid rgba(99,102,241,0.5)",
            outlineOffset: 0,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65" />
      )}

      {/* ── Tooltip card ── */}
      <div
        style={{
          position: "fixed",
          ...tooltipPos,
          zIndex: 9999,
          maxWidth: 300,
          opacity: visible ? 1 : 0,
          transform: `${tooltipPos.transform ?? ""} translateY(${visible ? 0 : 8}px)`,
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Barra de progreso */}
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/20 tracking-wide">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={endTour}
              className="text-slate-600 hover:text-slate-300 transition-colors shrink-0 -mt-0.5"
              aria-label="Cerrar tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Icono + título */}
          {step.icon && (
            <div className="text-2xl mb-2">{step.icon}</div>
          )}
          <h3 className="text-sm font-bold text-white leading-snug mb-1.5">{step.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

          {/* Controles */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={endTour}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Saltar
            </button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Anterior
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
              >
                {isLast ? "Entendido" : "Siguiente"}
                {!isLast && <ArrowRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Puntos de progreso */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "w-4 h-1.5 bg-primary-500"
                  : i < stepIndex
                  ? "w-1.5 h-1.5 bg-primary-800"
                  : "w-1.5 h-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
