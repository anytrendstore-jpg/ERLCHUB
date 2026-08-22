"use client";

interface TerminalFuncBarProps {
  onSearch: () => void;
  onDirectory: () => void;
  onLogout: () => void;
}

const KEYS = [
  { key: "F1", label: "SEARCH" },
  { key: "F2", label: "DIRECTORY" },
  { key: "F3", label: "MODULES" },
  { key: "F4", label: "SETTINGS" },
  { key: "F5", label: "LOCK SCREEN" },
  { key: "F6", label: "LOGOUT" },
];

/** Barra de funciones fija — refuerza que esto es una terminal especializada, no una web con botones. */
export default function TerminalFuncBar({ onSearch, onDirectory, onLogout }: TerminalFuncBarProps) {
  const handlers: Record<string, () => void> = { F1: onSearch, F2: onDirectory, F6: onLogout };

  return (
    <div className="h-[30px] flex items-center border-t border-[#1e2a45] bg-[#080b13] flex-shrink-0">
      {KEYS.map(({ key, label }) => {
        const handler = handlers[key];
        return (
          <button
            key={key}
            onClick={handler}
            disabled={!handler}
            className={`h-full flex items-center gap-1.5 px-3 border-r border-[#151d31] font-mono text-[9.5px] tracking-wide ${handler ? "text-[#6d7999] hover:text-[#dde3f2] hover:bg-[#111a2c]" : "text-[#3a4256] cursor-default"}`}
          >
            <b className="text-[#0d1424] bg-[#3c68c9] rounded-sm px-1 py-px">{key}</b>
            {label}
          </button>
        );
      })}
    </div>
  );
}
