"use client";

import { Check, UserPlus, MessageCircle, Gamepad2, FileText, Clock, CreditCard, CheckCircle } from "lucide-react";
import { PHASES, type WhitelistPhase } from "@/lib/whitelistTypes";

interface WhitelistStepperProps {
  currentPhase: WhitelistPhase;
  completedPhases?: WhitelistPhase[];
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  MessageCircle,
  Gamepad2,
  FileText,
  Clock,
  CreditCard,
  CheckCircle,
};

export default function WhitelistStepper({ currentPhase, completedPhases = [], compact = false }: WhitelistStepperProps) {
  const currentPhaseIndex = PHASES.findIndex(p => p.id === currentPhase);

  const getPhaseStatus = (phase: typeof PHASES[0]) => {
    if (completedPhases.includes(phase.id)) return "completed";
    if (phase.id === currentPhase) return "current";
    if (PHASES.findIndex(p => p.id === phase.id) < currentPhaseIndex) return "completed";
    return "pending";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {PHASES.filter(p => p.id !== "completed").map((phase, index) => {
          const status = getPhaseStatus(phase);
          const Icon = iconMap[phase.icon];

          return (
            <div key={phase.id} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all duration-300
                  ${status === "completed"
                    ? "bg-[#22c55e] text-white"
                    : status === "current"
                      ? "bg-[#8e00f7] text-white ring-2 ring-[#8e00f7]/50 ring-offset-2 ring-offset-[var(--background)]"
                      : "bg-[var(--card-bg-2)] text-[var(--text-faint)]"
                  }
                `}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{phase.number + 1}</span>
                )}
              </div>
              {index < PHASES.length - 2 && (
                <div
                  className={`w-6 h-0.5 mx-1 transition-colors duration-300 ${
                    status === "completed" ? "bg-[#22c55e]" : "bg-[var(--card-bg-2)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full version
  return (
    <div className="w-full">
      {/* Desktop horizontal stepper */}
      <div className="hidden lg:flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-[var(--card-bg-2)]" />

        {/* Progress line filled */}
        <div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#22c55e] to-[#8e00f7] transition-all duration-500"
          style={{
            width: `${Math.min((currentPhaseIndex / (PHASES.length - 2)) * 100, 100)}%`
          }}
        />

        {PHASES.filter(p => p.id !== "completed").map((phase) => {
          const status = getPhaseStatus(phase);
          const Icon = iconMap[phase.icon];

          return (
            <div key={phase.id} className="flex flex-col items-center relative z-10">
              {/* Circle */}
              <div
                className={`
                  flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 mb-3
                  ${status === "completed"
                    ? "bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/30"
                    : status === "current"
                      ? "bg-[#8e00f7] text-white shadow-lg shadow-[#8e00f7]/30 ring-4 ring-[#8e00f7]/20"
                      : "bg-[var(--card-bg)] border-2 border-[var(--card-border-soft)] text-[var(--text-faint)]"
                  }
                `}
              >
                {status === "completed" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <div
                  className={`text-sm font-semibold transition-colors ${
                    status === "completed"
                      ? "text-[#22c55e]"
                      : status === "current"
                        ? "text-[var(--foreground)]"
                        : "text-[var(--text-faint)]"
                  }`}
                >
                  {phase.title}
                </div>
                <div className="text-xs text-[var(--text-faint)] mt-0.5 max-w-[100px]">
                  {phase.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile/Tablet vertical stepper */}
      <div className="lg:hidden space-y-4">
        {PHASES.filter(p => p.id !== "completed").map((phase, index) => {
          const status = getPhaseStatus(phase);
          const Icon = iconMap[phase.icon];
          const isLast = index === PHASES.length - 2;

          return (
            <div key={phase.id} className="flex items-start gap-4">
              {/* Line and circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all duration-300
                    ${status === "completed"
                      ? "bg-[#22c55e] text-white"
                      : status === "current"
                        ? "bg-[#8e00f7] text-white ring-4 ring-[#8e00f7]/20"
                        : "bg-[var(--card-bg)] border-2 border-[var(--card-border-soft)] text-[var(--text-faint)]"
                    }
                  `}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 h-8 mt-2 transition-colors duration-300 ${
                      status === "completed" ? "bg-[#22c55e]" : "bg-[var(--card-bg-2)]"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div
                  className={`font-semibold transition-colors ${
                    status === "completed"
                      ? "text-[#22c55e]"
                      : status === "current"
                        ? "text-[var(--foreground)]"
                        : "text-[var(--text-faint)]"
                  }`}
                >
                  Fase {phase.number + 1}: {phase.title}
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-0.5">
                  {phase.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
