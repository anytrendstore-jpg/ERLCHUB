"use client";

import { useState, useEffect } from "react";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import { useWhitelistStatus } from "@/hooks/useWhitelistStatus";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Calendar, Shield, Crown, Coins, ShoppingCart, TrendingUp, CheckCircle, XCircle, Clock, MapPin, ArrowLeft, X, ShieldCheck, LayoutDashboard, ArrowRight, RefreshCw, CreditCard } from "lucide-react";
import CardTokenizeForm from "@/components/tienda/CardTokenizeForm";

export default function PerfilPage() {
  const { user, guilds, isAuthenticated } = useDiscordAuth();
  const { balance: hubCoinsBalance } = useHubCoins();
  const { isStaff, hasApplication, completed, nextRoute } = useWhitelistStatus();
  const membershipLevel = user?.membership?.name || "Ninguna";
  
  const [profileData, setProfileData] = useState<any>({
    hubCoinsBalance: 0,
    totalHubCoinsPurchased: 0,
    totalSpent: 0,
    totalOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
    recentActivity: [],
    allTransactions: [],
    serverJoins: {
      erlchub: null,
      losSantos: null
    },
    currentCity: null,
    membership: null
  });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [savingCard, setSavingCard] = useState(false);

  const fetchSubscription = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/memberships/manage?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setSubscription(data.subscription);
    } catch (error) {
      console.error('Error consultando la suscripción:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const handleToggleAutoRenew = async () => {
    if (!user?.id || !subscription) return;
    setTogglingAutoRenew(true);
    try {
      const res = await fetch('/api/memberships/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'toggle_auto_renew', data: { autoRenew: !subscription.autoRenew } }),
      });
      const result = await res.json();
      if (result.success) await fetchSubscription();
      else alert('No se pudo actualizar: ' + result.error);
    } catch (error) {
      console.error('Error cambiando auto-renovación:', error);
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const handleCardTokenized = async (cardToken: string) => {
    if (!user?.id || !subscription) return;
    setSavingCard(true);
    try {
      const res = await fetch('/api/shop/checkout/save-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerEmail: `user_${user.id}@erlchub.pro`, membershipId: subscription.membershipId, cardToken }),
      });
      const result = await res.json();
      if (result.success) {
        setShowCardForm(false);
        await fetchSubscription();
      } else {
        alert('No se pudo guardar la tarjeta: ' + result.error);
      }
    } catch (error) {
      console.error('Error guardando método de pago:', error);
      alert('No se pudo guardar la tarjeta.');
    } finally {
      setSavingCard(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/data?userId=${user.id}`);
        const result = await response.json();
        
        console.log('Profile data received:', result); 
        
        if (result.success) {
          setProfileData(result.profileData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user?.id]);

  const getMemberSince = () => {
    const dateStr = profileData.serverJoins?.erlchub || profileData.serverJoins?.losSantos;
    
    if (dateStr && dateStr !== "null") {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (user?.membership?.purchasedAt) {
      return new Date(user.membership.purchasedAt).toLocaleDateString('es-CO');
    }

    return "N/A";
  };

  const getCurrentCityName = () => {
    if (profileData && profileData.currentCity) {
      return profileData.currentCity.name || "Los Santos";
    }
    return null;
  };

  const handleCancelMembership = async () => {
    if (!isAuthenticated || !user?.id) {
      alert('Debes iniciar sesión para cancelar tu membresía');
      return;
    }

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar tu membresía permanente? ' +
      'Esta acción no se puede deshacer y perderás todos los beneficios inmediatamente.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/memberships/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'cancel'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Membresía cancelada exitosamente. Redirigiendo a tu perfil...');
        window.location.reload(); 
      } else {
        alert('Error al cancelar la membresía: ' + result.error);
      }
    } catch (error) {
      console.error('Error cancelando membresía:', error);
      alert('Error al cancelar la membresía. Por favor, intenta nuevamente.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-alt)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Acceso Restringido</h1>
          <p className="text-[var(--text-muted)] mb-8">Debes iniciar sesión para ver tu perfil</p>
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

  return (
    <div className="min-h-screen bg-[var(--background-alt)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Mi Perfil</h1>

        {/* Acceso al panel de staff: solo para cuentas de staff */}
        {isStaff && (
          <Link
            href="/staff"
            className="group flex items-center gap-4 mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#0E1420] to-[#111827] border border-blue-500/30 hover:border-blue-500/60 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold">Panel de Staff</div>
              <div className="text-sm text-slate-400">
                Revisa y acepta las solicitudes de whitelist de los nuevos jugadores
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
        )}

        {/* Dashboard del usuario, o whitelist si todavía no la ha hecho */}
        <Link
          href={completed || !hasApplication ? "/dashboard" : nextRoute}
          className="group flex items-center gap-4 mb-8 p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#8e00f7]/50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="h-6 w-6 text-[#8e00f7]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--foreground)] font-bold">
              {hasApplication && !completed ? "Continuar mi whitelist" : "Mi Dashboard"}
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              {hasApplication && !completed
                ? "Retoma tu solicitud donde la dejaste"
                : "Entra a tu escritorio de ERLC HUB"}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-[#8e00f7] group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </Link>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            {user?.avatar && (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                alt={user.username}
                className="w-24 h-24 rounded-full border-4 border-[#8e00f7]"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {user?.global_name || user?.username}
              </h2>
              <div className="flex items-center gap-4 text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>@{user?.username}</span>
                </div>
                {user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Miembro desde {getMemberSince()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#8e00f7]" />
                  <span>
                    Ciudad: {getCurrentCityName() || "No está en ninguna ciudad"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Crown className={`h-5 w-5 ${membershipLevel !== "Ninguna" ? 'text-[#fbbf24]' : 'text-[var(--text-muted)]'}`} />
                <span className={`font-bold text-lg ${membershipLevel !== "Ninguna" ? 'text-[#fbbf24]' : 'text-[var(--text-muted)]'}`}>
                  {membershipLevel}
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm">Nivel de Membresía</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-8">
            <div className="flex items-center gap-4 mb-3">
              <Image
                src="/hub-coins.png"
                alt="Hub Coins"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-[var(--text-muted)] text-base">Hub Coins</span>
            </div>
            <div className="text-3xl font-bold text-[var(--foreground)] mb-1">
              {profileData.hubCoinsBalance || hubCoinsBalance || 0}
            </div>
            <p className="text-[var(--text-muted)] text-sm">Saldo actual</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-12">
            <div className="flex items-center gap-4 mb-3">
              <TrendingUp className="h-6 w-6 text-[#8e00f7]" />
              <span className="text-[var(--text-muted)] text-base">Total Gastado</span>
            </div>
            <div className="text-3xl font-bold text-[var(--foreground)] mb-1">
              ${profileData.totalSpent || 0}
            </div>
            <p className="text-[var(--text-muted)] text-sm">En compras</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl p-12">
            <div className="flex items-center gap-4 mb-3">
              <Clock className="h-6 w-6 text-[#f59e0b]" />
              <span className="text-[var(--text-muted)] text-base">Actividad Reciente</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-400 text-sm">Aceptadas:</span>
                <span className="text-[var(--foreground)] font-bold text-lg">{profileData.completedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-sm">Rechazadas:</span>
                <span className="text-[var(--foreground)] font-bold text-lg">{profileData.rejectedOrders || 0}</span>
              </div>
              <div className="border-t border-[var(--card-border-soft)] pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] text-sm">Total:</span>
                  <span className="text-[var(--foreground)] font-bold text-xl">{profileData.recentActivity?.length || 0}</span>
                </div>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm mt-3">Últimas transacciones</p>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-6">Actividad Reciente</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e00f7] mx-auto"></div>
              <p className="text-[var(--text-muted)] mt-4">Cargando actividad...</p>
            </div>
          ) : !profileData.recentActivity || profileData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)]">No hay actividad reciente</p>
            </div>
          ) : (
            profileData.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[var(--card-bg-2)] rounded-lg mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'completed' 
                      ? 'bg-green-500/20' 
                      : activity.status === 'rejected' || activity.status === 'cancelled'
                      ? 'bg-red-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    {activity.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : activity.status === 'rejected' || activity.status === 'cancelled' ? (
                      <XCircle className="h-5 w-5 text-red-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[var(--foreground)] font-medium">
                      {activity.isHubCoins ? 'Hub Coins' : 'Compra'}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">
                      {activity.isHubCoins ? 'Hub Coins recibidos' : activity.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[var(--foreground)] font-bold">
                    {activity.isHubCoins ? (
                      <span className="flex items-center gap-1">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        +{Math.abs(activity.amount)} HC
                      </span>
                    ) : (
                      `$${Math.abs(activity.amount)}`
                    )}
                  </p>
                  <p className="text-[var(--text-muted)] text-sm">
                    {(() => {
                      const date = new Date(activity.timestamp);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      
                      if (diffHours < 1) {
                        return 'Hace unos minutos';
                      } else if (diffHours < 24) {
                        return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
                      } else {
                        return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {subscription && subscription.membershipType === 'monthly' && subscription.status === 'active' && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#8e00f7]" />
              Renovación automática — {subscription.membershipName}
            </h3>

            {subscription.paymentSourceId ? (
              <div className="bg-[var(--card-bg-2)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[var(--foreground)] font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#8e00f7]" />
                    {subscription.autoRenew ? 'Se renueva sola cada mes' : 'Auto-renovación desactivada'}
                  </p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">
                    {subscription.autoRenew
                      ? `Próximo cobro: ${subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate).toLocaleDateString('es-CO') : '—'} · $${subscription.renewalPrice} USD`
                      : 'Tenés una tarjeta guardada pero la renovación automática está apagada — la membresía vencerá sin cobrarse sola.'}
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoRenew}
                  disabled={togglingAutoRenew}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${subscription.autoRenew ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                >
                  {togglingAutoRenew ? 'Guardando...' : subscription.autoRenew ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ) : showCardForm ? (
              <div className="bg-[var(--card-bg-2)] rounded-xl p-4">
                <CardTokenizeForm onTokenized={handleCardTokenized} submitLabel={savingCard ? 'Guardando...' : 'Guardar y activar renovación automática'} />
              </div>
            ) : (
              <div className="bg-[var(--card-bg-2)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[var(--text-muted)] text-sm">
                  No tenés un método de pago guardado — cuando venza, vas a tener que renovar a mano desde la tienda.
                </p>
                <button
                  onClick={() => setShowCardForm(true)}
                  className="px-4 py-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-medium rounded-lg transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <CreditCard className="h-4 w-4" />
                  Activar renovación automática
                </button>
              </div>
            )}
          </div>
        )}

        {profileData.membership && profileData.membership.type === 'permanent' && profileData.membership.status === 'active' && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#fbbf24]" />
              Gestión de Membresía Permanente
            </h3>
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-red-400 font-semibold mb-2">¿Deseas cancelar tu membresía?</h4>
                <p className="text-[var(--text-muted)] text-sm mb-4">
                  Al cancelar tu membresía permanente, perderás todos los beneficios inmediatamente 
                  y no podrás recuperarlos sin comprar una nueva membresía.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCancelMembership}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar Membresía
                  </button>
                  <button
                    onClick={() => window.location.href = '/tienda/membresia'}
                    className="px-4 py-2 bg-[var(--card-bg-2)] hover:bg-[#2a2a38] text-[var(--foreground)] font-medium rounded-lg transition-all"
                  >
                    Ver Otras Membresías
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar a Inicio
          </button>
        </div>
      </div>
    </div>
  );
}