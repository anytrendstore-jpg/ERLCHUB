"use client";

import { useState, useEffect } from "react";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { Users, Gift, Copy, Check, Crown, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function ReferidosPage() {
  const { user, isAuthenticated } = useDiscordAuth();
  const [referralData, setReferralData] = useState({
    referralCode: "",
    totalReferrals: 0,
    pendingReferrals: 0,
    totalHubCoinsEarned: 0,
    referralLink: "",
    recentReferrals: []
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customCode, setCustomCode] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [validation, setValidation] = useState({
    hasValidLength: false,
    hasNumber: false,
    hasLetter: false,
    noSpecialChars: false,
    isValid: false
  });
  const [validationError, setValidationError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchReferralData();
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Acceso Restringido</h1>
          <p className="text-[var(--text-muted)] mb-8">Debes iniciar sesión para ver tus referidos</p>
          <a
            href="/ingresar"
            className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold px-6 py-3 rounded-full transition-all"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const validateCodeFormat = (code: string) => {
    const hasValidLength = code.length === 5;
    const hasNumber = /\d/.test(code);
    const hasLetter = /[a-z]/.test(code);
    const noSpecialChars = /^[a-z0-9]+$/.test(code);

    setValidation({
      hasValidLength,
      hasNumber,
      hasLetter,
      noSpecialChars,
      isValid: hasValidLength && hasNumber && hasLetter && noSpecialChars
    });

    let error = '';
    if (!hasValidLength) error = 'El código debe tener exactamente 5 caracteres';
    else if (!hasNumber) error = 'El código debe tener al menos 1 número';
    else if (!hasLetter) error = 'El código debe tener al menos 1 letra';
    else if (!noSpecialChars) error = 'El código no debe tener símbolos especiales';

    setValidationError(error);
  };

  const handleCreateCode = async () => {
    if (!customCode.trim()) {
      alert('Por favor, ingresa un código');
      return;
    }

    if (!validation.isValid) {
      alert('Por favor, corrige los errores en el código');
      return;
    }

    setCreatingCode(true);
    try {
      const response = await fetch('/api/referrals/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          action: 'create_code',
          data: { code: customCode.trim() }
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchReferralData();
        setCustomCode("");
        setValidation({
          hasValidLength: false,
          hasNumber: false,
          hasLetter: false,
          noSpecialChars: false,
          isValid: false
        });
        setValidationError("");
        setShowCreateModal(false);
        alert('Código creado exitosamente');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating code:', error);
      alert('Error al crear el código');
    } finally {
      setCreatingCode(false);
    }
  };

  const fetchReferralData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`/api/referrals/manage?userId=${user.id}&_t=${timestamp}`);
      const result = await response.json();

      if (result.success) {
        setReferralData(result.referralData);
        if (!result.referralData.referralCode) {
          setShowCreateModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-alt)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Referidos</h1> 

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm">Total Referidos</p>
                <p className="text-2xl font-bold text-blue-400">{referralData.totalReferrals}</p>
              </div>
            </div>
          </div> 
          

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-400">{referralData.pendingReferrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-full flex items-center justify-center">
                <Image
                  src="/hub-coins.png"
                  alt="Hub Coins"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-sm">HC Ganados</p>
                <p className="text-2xl font-bold text-[#fbbf24]">{referralData.totalHubCoinsEarned.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#8e00f7]" />
              Tu Enlace de Referido
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--text-muted)]">Cargando tu código...</p>
              </div>
            ) : referralData.referralCode ? (
              <div className="space-y-4">
                <div className="bg-[var(--card-bg-2)] rounded-lg p-4">
                  <p className="text-[var(--text-muted)] text-sm mb-2">Enlace completo:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={referralData.referralLink}
                      readOnly
                      className="flex-1 bg-transparent text-[var(--foreground)] font-mono text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-4 py-2 rounded-lg transition-all"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
                
                <div className="bg-[var(--card-bg-2)] rounded-lg p-4">
                  <p className="text-[var(--text-muted)] text-sm mb-2">Código de referido:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--background-alt)] rounded-lg px-4 py-3 text-center">
                      <span className="text-[var(--foreground)] font-bold text-lg font-mono">{referralData.referralCode}</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-2 bg-[#fbbf24] hover:bg-[#e6a503] text-white px-4 py-2 rounded-lg transition-all"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[var(--card-bg-2)] rounded-lg p-4">
                  <h4 className="text-[var(--foreground)] font-medium mb-3">Crea tu código de referido</h4>
                  <p className="text-[var(--text-muted)] text-sm mb-4">
                    El código debe cumplir con los siguientes requerimientos:
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      {validation.hasValidLength ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <span className="text-red-400 font-bold text-sm">X</span>
                      )}
                      <span className={`text-sm ${validation.hasValidLength ? 'text-green-400' : 'text-red-400'}`}>
                        5 Caracteres
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {validation.hasNumber ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <span className="text-red-400 font-bold text-sm">X</span>
                      )}
                      <span className={`text-sm ${validation.hasNumber ? 'text-green-400' : 'text-red-400'}`}>
                        Al menos 1 número
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {validation.hasLetter ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <span className="text-red-400 font-bold text-sm">X</span>
                      )}
                      <span className={`text-sm ${validation.hasLetter ? 'text-green-400' : 'text-red-400'}`}>
                        Al menos 1 letra
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {validation.noSpecialChars ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <span className="text-red-400 font-bold text-sm">X</span>
                      )}
                      <span className={`text-sm ${validation.noSpecialChars ? 'text-green-400' : 'text-red-400'}`}>
                        No debe tener símbolos especiales
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        setCustomCode(value);
                        validateCodeFormat(value);
                      }}
                      placeholder="Ej: abc123"
                      maxLength={5}
                      className={`flex-1 bg-[var(--background-alt)] text-[var(--foreground)] px-4 py-2 rounded-lg font-mono ${
                        validationError ? 'border border-red-500' : ''
                      }`}
                      pattern="[a-z0-9]{5}"
                    />
                    <button
                      onClick={handleCreateCode}
                      disabled={creatingCode || !validation.isValid}
                      className="flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all"
                    >
                      {creatingCode ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {creatingCode ? "Creando..." : "Crear"}
                    </button>
                  </div>
                  
                  {validationError && (
                    <p className="text-red-400 text-sm mt-2">
                      {validationError}
                    </p>
                  )}
                  
                  <p className="text-[var(--text-faint)] text-xs mt-2">
                    Solo letras minúsculas y números. Los símbolos como ,.-¿¡'? no están permitidos.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#fbbf24]" />
              Beneficios del Programa
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-medium">250 Hub Coins por compra</p>
                  <p className="text-[var(--text-muted)] text-sm">Gana 250 HC por cada compra completada de tus referidos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-medium">Entrega inmediata</p>
                  <p className="text-[var(--text-muted)] text-sm">Recibe tus comisiones al instante cuando se completa la compra</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-medium">Seguimiento real</p>
                  <p className="text-[var(--text-muted)] text-sm">Ve en tiempo real tus referidos y comisiones ganadas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <div>
                  <p className="text-[var(--foreground)] font-medium">Sin límites</p>
                  <p className="text-[var(--text-muted)] text-sm">Refiere a tantas personas como quieras sin restricciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Referidos Recientes</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[var(--text-muted)]">Cargando referidos...</p>
              </div>
            ) : referralData.recentReferrals.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--card-border-soft)]">
                    <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Fecha</th>
                    <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Estado</th>
                    <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {referralData.recentReferrals.map((referral: any, index: number) => (
                    <tr key={index} className="border-b" style={{ borderColor: "color-mix(in srgb, var(--card-border-soft) 50%, transparent)" }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {referral.referredAvatar ? (
                            <img 
                              src={referral.referredAvatar} 
                              alt={referral.referredUsername}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-[#8e00f7]/20 rounded-full flex items-center justify-center">
                              <span className="text-[#8e00f7] font-bold text-xs">
                                {referral.referredUsername?.slice(0, 2).toUpperCase() || 'UR'}
                              </span>
                            </div>
                          )}
                          <span className="text-[var(--foreground)]">{referral.referredUsername}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">
                        {new Date(referral.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          referral.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {referral.status === 'completed' ? (
                            <>
                              <Check className="h-3 w-3" />
                              Completado
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {referral.status === 'completed' ? (
                          <span className="text-green-400 font-medium">+{referral.commissionAmount} HC</span>
                        ) : (
                          <span className="text-[var(--text-muted)] font-medium">0 HC</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">No tienes referidos aún</p>
                <p className="text-[var(--text-faint)] text-sm mt-2">Comparte tu enlace para empezar a ganar Hub Coins</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            Regresar a Inicio
          </button>
        </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Crea tu Código de Referido</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              Para poder usar el sistema de referidos, necesitas crear tu código personalizado.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                {validation.hasValidLength ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-red-400 font-bold text-sm">X</span>
                )}
                <span className={`text-sm ${validation.hasValidLength ? 'text-green-400' : 'text-red-400'}`}>
                  5 Caracteres
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {validation.hasNumber ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-red-400 font-bold text-sm">X</span>
                )}
                <span className={`text-sm ${validation.hasNumber ? 'text-green-400' : 'text-red-400'}`}>
                  Al menos 1 número
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {validation.hasLetter ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-red-400 font-bold text-sm">X</span>
                )}
                <span className={`text-sm ${validation.hasLetter ? 'text-green-400' : 'text-red-400'}`}>
                  Al menos 1 letra
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {validation.noSpecialChars ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-red-400 font-bold text-sm">X</span>
                )}
                <span className={`text-sm ${validation.noSpecialChars ? 'text-green-400' : 'text-red-400'}`}>
                  No debe tener símbolos especiales
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={customCode}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  setCustomCode(value);
                  validateCodeFormat(value);
                }}
                placeholder="Ej: abc123"
                maxLength={5}
                className={`flex-1 bg-[var(--background-alt)] text-white px-4 py-2 rounded-lg font-mono ${
                  validationError ? 'border border-red-500' : ''
                }`}
                pattern="[a-z0-9]{5}"
              />
            </div>
            
            {validationError && (
              <p className="text-red-400 text-xs mb-4">{validationError}</p>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleCreateCode}
                disabled={creatingCode || !validation.isValid}
                className="flex-1 flex items-center justify-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all"
              >
                {creatingCode ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {creatingCode ? "Creando..." : "Crear Código"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}