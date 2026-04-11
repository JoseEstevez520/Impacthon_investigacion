import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Seleccionar...",
  formatDisplay = (value) => value, // Función opcional para formatear valores al mostrar
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
    // El dropdown se mantiene abierto
  };

  const removeValue = (value, e) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  // Opciones disponibles (no seleccionadas)
  const availableOptions = options.filter((opt) => !selectedValues.includes(opt));

  return (
    <div className="flex-1 flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Dropdown button and menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu - Se mantiene abierto */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
            <div
              className="max-h-56 overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {availableOptions.length > 0 ? (
                availableOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 text-sm">
                      +
                    </span>
                    <span className="capitalize">{formatDisplay(option)}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
                  Todas las opciones seleccionadas
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

