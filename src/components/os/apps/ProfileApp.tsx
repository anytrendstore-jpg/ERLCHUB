'use client';

import React from 'react';
import Link from 'next/link';
import { useOS } from '@/contexts/OSContext';
import {
  Shield,
  Calendar,
  IdCard,
  MessageSquare,
  Gamepad2,
  Clock,
  LayoutGrid,
  Bell,
  BadgeCheck,
  ExternalLink
} from 'lucide-react';

export default function ProfileApp() {
  const { user, installedApps, notifications } = useOS();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const stats = [
    { label: 'Aplicaciones instaladas', value: String(installedApps.length), icon: LayoutGrid },
    { label: 'Último acceso', value: user.lastLogin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), icon: Clock },
    { label: 'Notificaciones sin leer', value: String(unreadCount), icon: Bell },
  ];

  const recentActivity = notifications.slice(0, 6);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#0a0a0f]">
      {/* Header Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-16 relative">
        {/* Avatar & Basic Info */}
        <div className="flex items-end gap-6 mb-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-32 h-32 rounded-2xl border-4 border-[#0a0a0f] bg-gray-800"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0a0a0f]" />
          </div>
          <div className="pb-2">
            <h1 className="text-white text-2xl font-bold">{user.displayName}</h1>
            <p className="text-white/50">@{user.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                {user.role === 'user' ? 'Ciudadano' : user.role === 'staff' ? 'Staff' : 'Admin'}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verificado
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <IdCard className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-medium">DNI Digital</h3>
            </div>
            <p className="text-white/40 text-sm mb-1">Número de identificación</p>
            {user.dni ? (
              <p className="text-white font-mono">{user.dni}</p>
            ) : (
              <Link href="/whitelist" className="text-sm text-blue-400 hover:underline">
                Todavía no tienes DNI — completa la whitelist
              </Link>
            )}
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-medium">Miembro desde</h3>
            </div>
            <p className="text-white/40 text-sm mb-1">Fecha de registro</p>
            <p className="text-white">
              {user.createdAt.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-white font-medium">Discord</h3>
            </div>
            <p className="text-white/40 text-sm mb-1">ID de Discord</p>
            <p className="text-white font-mono">{user.discordId}</p>
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-white font-medium">Roblox</h3>
              </div>
              {user.robloxVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
                  <BadgeCheck className="w-3 h-3" /> Verificado
                </span>
              )}
            </div>
            {user.robloxVerified && user.robloxUsername ? (
              <>
                <p className="text-white/40 text-sm mb-1">Usuario</p>
                <p className="text-white font-mono">@{user.robloxUsername}</p>
                <p className="text-white/40 text-sm mb-1 mt-3">ID de Roblox</p>
                <p className="text-white font-mono flex items-center gap-2">
                  {user.robloxId}
                  {user.robloxId && (
                    <a
                      href={`https://www.roblox.com/users/${user.robloxId}/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </p>
              </>
            ) : (
              <Link href="/whitelist/roblox" className="text-sm text-red-400 hover:underline">
                Vincula tu cuenta de Roblox
              </Link>
            )}
          </div>
        </div>

        {/* Activity Section */}
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-white font-medium">Actividad Reciente</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Sin notificaciones todavía.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {recentActivity.map((n) => (
                <div key={n.id} className="flex items-center gap-4 p-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    n.type === 'success' ? 'bg-green-400' : n.type === 'error' ? 'bg-red-400' : n.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{n.title}</p>
                    <p className="text-white/40 text-xs">{new Date(n.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
