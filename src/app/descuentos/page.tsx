"use client";

import { useState, useEffect } from "react";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { Gift, Plus, Trash2, Calendar, Clock, CheckCircle, XCircle, Home, Tag, Percent } from "lucide-react";

const AUTHORIZED_DISCORD_IDS = [
  "917085596189593631",
  "1166814841583960167"
];

interface DiscountCode {
  id: string;
  code: string;
  discountPercentage: number;
  description: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  usageCount?: number;
  maxUses?: number;
}

export default function DescuentosPage() {
  const { user, isAuthenticated } = useDiscordAuth();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({
    code: "",
    discountPercentage: 10,
    description: "",
    daysToExpire: 30
  });
  const [creatingCode, setCreatingCode] = useState(false);
  const hasAccess = isAuthenticated && AUTHORIZED_DISCORD_IDS.includes(user?.id || "");

  useEffect(() => {
    if (hasAccess) {
      fetchDiscountCodes();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/discounts/manage');
      const result = await response.json();

      if (result.success) {
        setDiscountCodes(result.codes);
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDiscountCode = async () => {
    if (!newCode.code.trim()) {
      alert('Por favor, ingresa un código de descuento');
      return;
    }

    setCreatingCode(true);
    try {
      const response = await fetch('/api/discounts/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          data: {
            code: newCode.code.trim(),
            discountPercentage: newCode.discountPercentage,
            description: newCode.description,
            daysToExpire: newCode.daysToExpire
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchDiscountCodes();
        setNewCode({
          code: "",
          discountPercentage: 10,
          description: "",
          daysToExpire: 30
        });
        alert('Código de descuento creado exitosamente');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      alert('Error al crear el código de descuento');
    } finally {
      setCreatingCode(false);
    }
  };

  const deleteDiscountCode = async (codeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este código de descuento?')) {
      return;
    }

    try {
      const response = await fetch('/api/discounts/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          data: { codeId }
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchDiscountCodes();
        alert('Código de descuento eliminado exitosamente');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting discount code:', error);
      alert('Error al eliminar el código de descuento');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatCode = (code: string) => {
    return code.toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Acceso Restringido</h1>
          <p className="text-gray-400 mb-8">Debes iniciar sesión para acceder a esta página</p>
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-gray-400 mb-8">No tienes permisos para acceder a esta página</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold px-6 py-3 rounded-full transition-all"
          >
            <Home className="h-4 w-4" />
            Regresar a Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Gestión de Descuentos</h1>

        {/* Crear Nuevo Código */}
        <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#8e00f7]" />
            Crear Nuevo Código
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Código de Descuento</label>
              <input
                type="text"
                value={newCode.code}
                onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                placeholder="Ej: VERANO20"
                className="w-full bg-[#1a1a28] text-white px-4 py-2 rounded-lg font-mono"
              />
              <p className="text-gray-500 text-xs mt-1">Se mostrará automáticamente en mayúsculas</p>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Porcentaje de Descuento (%)</label>
              <input
                type="number"
                value={newCode.discountPercentage}
                onChange={(e) => setNewCode({...newCode, discountPercentage: parseInt(e.target.value) || 0})}
                min="1"
                max="100"
                className="w-full bg-[#1a1a28] text-white px-4 py-2 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Días para Vencimiento</label>
              <input
                type="number"
                value={newCode.daysToExpire}
                onChange={(e) => setNewCode({...newCode, daysToExpire: parseInt(e.target.value) || 30})}
                min="1"
                max="365"
                className="w-full bg-[#1a1a28] text-white px-4 py-2 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Descripción</label>
              <input
                type="text"
                value={newCode.description}
                onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                placeholder="Ej: Descuento de verano"
                className="w-full bg-[#1a1a28] text-white px-4 py-2 rounded-lg"
              />
            </div>
          </div>
          
          <button
            onClick={createDiscountCode}
            disabled={creatingCode || !newCode.code.trim()}
            className="flex items-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all"
          >
            {creatingCode ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {creatingCode ? "Creando..." : "Crear Código"}
          </button>
        </div>

        <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#fbbf24]" />
            Códigos Activos
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando códigos de descuento...</p>
            </div>
          ) : discountCodes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a28]">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Código</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Descuento</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Descripción</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha de Creación</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha de Vencimiento</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {discountCodes.map((code) => (
                    <tr key={code.id} className="border-b border-[#1a1a28]/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-white bg-[#1a1a28] px-3 py-1 rounded">
                          {formatCode(code.code)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-bold">{code.discountPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{code.description}</td>
                      <td className="py-3 px-4 text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(code.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className={isExpired(code.expiresAt) ? "text-red-400" : "text-yellow-400"}>
                            {formatDate(code.expiresAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isExpired(code.expiresAt) 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {isExpired(code.expiresAt) ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Expirado
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Activo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteDiscountCode(code.id)}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No hay códigos de descuento creados</p>
              <p className="text-gray-500 text-sm mt-2">Crea tu primer código de descuento para empezar</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Home className="h-4 w-4" />
            Regresar a Inicio
          </button>
        </div>
      </div>
    </div>
  );
}