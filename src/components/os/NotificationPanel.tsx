'use client';

import React from 'react';
import { useOS } from '@/contexts/OSContext';
import { X, Trash2, AlertTriangle, Info, CheckCircle, AlertCircle, Wifi, Moon, MapPin, Plane } from 'lucide-react';

export default function NotificationPanel() {
  const {
    isNotificationPanelOpen,
    notifications,
    toggleNotificationPanel,
    markNotificationRead,
    clearAllNotifications
  } = useOS();

  if (!isNotificationPanelOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900]"
        onClick={toggleNotificationPanel}
      />

      {/* Panel - Windows 11 Style */}
      <div className="absolute bottom-20 right-3 w-[360px] max-h-[500px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl z-[950] overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Notificaciones</h3>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Limpiar todo"
              >
                <Trash2 className="w-4 h-4 text-white/50" />
              </button>
            )}
            <button
              onClick={toggleNotificationPanel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="p-3 border-b border-white/5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Wifi, label: 'WiFi', active: true },
              { icon: Moon, label: 'Noche', active: false },
              { icon: MapPin, label: 'GPS', active: true },
              { icon: Plane, label: 'Avión', active: false }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${
                    item.active ? '' : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                  style={item.active ? {
                    background: 'color-mix(in srgb, var(--os-accent) 25%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--os-accent) 40%, transparent)',
                  } : undefined}
                >
                  <Icon className="w-5 h-5" style={item.active ? { color: 'var(--os-accent)' } : { color: 'rgba(255,255,255,0.5)' }} />
                  <span className="text-[10px]" style={item.active ? { color: 'var(--os-accent)' } : { color: 'rgba(255,255,255,0.5)' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <Info className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer
                    ${!notification.read ? 'bg-white/[0.02]' : ''}
                  `}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-white font-medium text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--os-accent)' }} />
                        )}
                      </div>
                      <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{notification.message}</p>
                      <span className="text-white/30 text-xs mt-2 block">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
