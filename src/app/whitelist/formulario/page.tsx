"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Loader2, FileText,
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Save, Send, HelpCircle
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/whitelistTypes";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";

export default function QuestionnairePage() {
  const router = useRouter();
  const { application, loading, run } = useWhitelistApplication(["questionnaire"]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // Recupera el borrador guardado en la base de datos.
  useEffect(() => {
    if (!application || hydrated.current) return;
    hydrated.current = true;
    if (application.questionnaireDraft) {
      setAnswers(application.questionnaireDraft);
    }
  }, [application]);

  // Autoguardado del borrador (1,5 s tras dejar de escribir).
  const scheduleSave = useCallback((next: Record<string, string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await run("questionnaire_save", { answers: next });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 1500);
  }, [run]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const question = QUESTIONNAIRE_QUESTIONS[currentQuestion];
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const validateCurrentAnswer = (): boolean => {
    const answer = answers[question.id] || "";

    if (question.required && !answer.trim()) {
      setErrors(prev => ({ ...prev, [question.id]: "Esta pregunta es obligatoria" }));
      return false;
    }

    if (question.minLength && answer.length < question.minLength) {
      setErrors(prev => ({
        ...prev,
        [question.id]: `Mínimo ${question.minLength} caracteres (tienes ${answer.length})`
      }));
      return false;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[question.id];
      return newErrors;
    });
    return true;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => {
      const next = { ...prev, [question.id]: value };
      scheduleSave(next);
      return next;
    });
    if (errors[question.id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[question.id];
        return newErrors;
      });
    }
  };

  const goNext = () => {
    if (!validateCurrentAnswer()) return;

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowConfirmation(true);
    }
  };

  const goPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);

    try {
      await run("questionnaire_submit", { answers });
      router.push("/whitelist/espera");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo enviar el formulario");
      setIsSubmitting(false);
    }
  };

  const getCharCountDisplay = () => {
    const answer = answers[question.id] || "";
    const count = answer.length;
    const min = question.minLength || 0;
    const max = question.maxLength || 0;

    if (max) {
      const remaining = max - count;
      const color = remaining < 50 ? (remaining < 0 ? "text-red-400" : "text-yellow-400") : "text-gray-500";
      return (
        <span className={color}>
          {count}/{max} caracteres
          {min > 0 && count < min && ` (mínimo ${min})`}
        </span>
      );
    }
    return min > 0 ? <span className="text-gray-500">{count} caracteres (mínimo {min})</span> : null;
  };

  const allAnswered = QUESTIONNAIRE_QUESTIONS.every(q => {
    const answer = answers[q.id] || "";
    if (!q.required) return true;
    if (q.minLength && answer.length < q.minLength) return false;
    return answer.trim().length > 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#8e00f7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase="questionnaire" />

      <header className="relative z-20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ERLC HUB" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-white text-lg">ERLCᴴᵁᴮ</span>
          </Link>
          <Link
            href="/whitelist/roblox"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WhitelistStepper currentPhase="questionnaire" />
          </div>

          {application?.status === "needs_revision" && (
            <div className="mb-6 p-4 bg-orange-400/10 border border-orange-400/30 rounded-xl">
              <h3 className="text-sm font-semibold text-orange-400 mb-1">
                El staff te ha pedido correcciones
              </h3>
              <p className="text-sm text-gray-300">
                {application.staffNotes || "Revisa y amplía tus respuestas antes de volver a enviar."}
              </p>
            </div>
          )}

          <div className="bg-[#12121c]/90 backdrop-blur-sm border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#1e1e2e]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-[#8e00f7]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Formulario de Evaluación</h1>
                    <p className="text-gray-400">Demuestra tus conocimientos de roleplay</p>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-2xl font-bold text-white">{currentQuestion + 1}/{totalQuestions}</div>
                  <div className="text-sm text-gray-500">Preguntas</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Progreso</span>
                  <span className="text-[#8e00f7] font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-[#0a0a12] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8e00f7] to-[#a64dfa] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {!showConfirmation ? (
              <div className="p-6">
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  {QUESTIONNAIRE_QUESTIONS.map((q, index) => {
                    const hasAnswer = (answers[q.id] || "").trim().length > 0;
                    const isValid = !q.minLength || (answers[q.id] || "").length >= q.minLength;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          if (index <= currentQuestion || hasAnswer) {
                            setCurrentQuestion(index);
                          }
                        }}
                        disabled={index > currentQuestion && !hasAnswer}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                          index === currentQuestion
                            ? "bg-[#8e00f7] text-white ring-2 ring-[#8e00f7]/50"
                            : hasAnswer && isValid
                              ? "bg-[#22c55e] text-white"
                              : hasAnswer && !isValid
                                ? "bg-yellow-500 text-white"
                                : "bg-[#1a1a28] text-gray-500 hover:bg-[#2a2a3a]"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8e00f7] flex items-center justify-center text-white font-bold text-sm">
                      {currentQuestion + 1}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-white leading-relaxed">
                        {question.question}
                        {question.required && <span className="text-red-400 ml-1">*</span>}
                      </h2>
                      {question.hint && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{question.hint}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    {question.type === "textarea" && (
                      <div>
                        <textarea
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder="Escribe tu respuesta aquí..."
                          rows={6}
                          maxLength={question.maxLength}
                          className={`w-full p-4 bg-[#0a0a12] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors resize-none ${
                            errors[question.id]
                              ? "border-red-500 focus:border-red-500"
                              : "border-[#1e1e2e] focus:border-[#8e00f7]"
                          }`}
                        />
                        <div className="flex items-center justify-between mt-2 text-sm">
                          {getCharCountDisplay()}
                        </div>
                      </div>
                    )}

                    {question.type === "text" && (
                      <input
                        type="text"
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        maxLength={question.maxLength}
                        className={`w-full h-14 px-4 bg-[#0a0a12] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                          errors[question.id]
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#1e1e2e] focus:border-[#8e00f7]"
                        }`}
                      />
                    )}

                    {question.type === "select" && question.options && (
                      <div className="grid gap-2">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleAnswerChange(option)}
                            className={`w-full p-4 rounded-xl text-left transition-colors ${
                              answers[question.id] === option
                                ? "bg-[#8e00f7] text-white"
                                : "bg-[#0a0a12] border border-[#1e1e2e] text-gray-400 hover:border-[#8e00f7] hover:text-white"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {question.type === "radio" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                              answers[question.id] === option
                                ? "bg-[#8e00f7]/20 border border-[#8e00f7]"
                                : "bg-[#0a0a12] border border-[#1e1e2e] hover:border-[#8e00f7]/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={answers[question.id] === option}
                              onChange={(e) => handleAnswerChange(e.target.value)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              answers[question.id] === option
                                ? "border-[#8e00f7] bg-[#8e00f7]"
                                : "border-gray-500"
                            }`}>
                              {answers[question.id] === option && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className={answers[question.id] === option ? "text-white" : "text-gray-400"}>
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {errors[question.id] && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors[question.id]}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1e1e2e]">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-colors"
                  >
                    {currentQuestion === totalQuestions - 1 ? (
                      <>
                        Revisar Respuestas
                        <CheckCircle className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-[#8e00f7]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Revisar y Enviar</h2>
                  <p className="text-gray-400">
                    Revisa tus respuestas antes de enviar. Una vez enviadas no podrás modificarlas.
                  </p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {QUESTIONNAIRE_QUESTIONS.map((q, index) => {
                    const answer = answers[q.id] || "";
                    const isValid = q.required ? answer.trim().length > 0 && (!q.minLength || answer.length >= q.minLength) : true;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          isValid ? "bg-[#0a0a12] border-[#1e1e2e]" : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-[#1a1a28] flex items-center justify-center text-xs text-white font-bold">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-400 truncate">{q.question}</span>
                            </div>
                            <p className={`text-sm ${answer ? "text-white" : "text-red-400 italic"}`}>
                              {answer || "Sin respuesta"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentQuestion(index);
                              setShowConfirmation(false);
                            }}
                            className="text-[#8e00f7] hover:text-[#a64dfa] text-sm flex-shrink-0"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1e1e2e]">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Volver al formulario
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !allAnswered}
                    className="flex items-center gap-2 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Formulario
                      </>
                    )}
                  </button>
                </div>

                {!allAnswered && (
                  <div className="flex items-center gap-2 justify-center text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Algunas respuestas no cumplen los requisitos mínimos
                  </div>
                )}

                {submitError && (
                  <div className="flex items-center gap-2 justify-center text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {saveState === "saving"
                ? "Guardando borrador..."
                : saveState === "saved"
                  ? "Borrador guardado en tu solicitud."
                  : "Tu progreso se guarda automáticamente."}{" "}
              <a href="https://discord.gg/xKJqNX7uC3" target="_blank" rel="noopener noreferrer" className="text-[#8e00f7] hover:underline">
                ¿Necesitas ayuda?
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}