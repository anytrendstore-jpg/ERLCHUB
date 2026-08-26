"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "erlchub-theme";

/** Botón de modo claro/oscuro — persiste en localStorage, sin depender de ningún contexto. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem(STORAGE_KEY, "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      title={isLight ? "Modo oscuro" : "Modo claro"}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border-soft)",
        color: "var(--text-muted)",
      }}
    >
      {isLight ? <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
    </button>
  );
}
