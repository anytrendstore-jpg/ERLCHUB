'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';
import { MDTProvider } from '@/contexts/MDTContext';
import { DepartmentProvider } from '@/contexts/DepartmentContext';
import { getDepartment } from '@/lib/departments';
import InstitutionalTerminalApp from '@/components/terminal/InstitutionalTerminalApp';

/** Solo en desarrollo — nunca debe estar disponible en producción. */
const DEMO_ALLOWED = process.env.NODE_ENV !== 'production';

type AccessState =
  | { status: 'checking' }
  | { status: 'denied'; reason: 'not_logged_in' | 'not_member' | 'faction_missing' | 'error' }
  | { status: 'allowed' }
  | { status: 'demo' };

function AccessScreen({ badge, title, message, onDemo }: { badge?: string; title: string; message: string; onDemo?: () => void }) {
  return (
    <div className="h-screen w-screen bg-[#05070d] flex items-center justify-center text-center px-6">
      <div>
        {badge && <img src={badge} alt="" className="h-16 w-auto mx-auto mb-5" />}
        <p className="text-white font-semibold mb-1">{title}</p>
        <p className="text-slate-500 text-sm max-w-sm">{message}</p>
        {onDemo && (
          <button
            onClick={onDemo}
            className="mt-5 px-4 py-2 rounded-lg bg-[#121a2e] border border-[#1e2a45] text-[#6f93d6] text-xs font-semibold hover:border-[#3c68c9] hover:text-white transition-colors"
          >
            Entrar en modo demo (solo desarrollo)
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Terminal institucional por departamento — destino propio, separado del
 * escritorio personal (OSDesktop). Reutiliza el mismo MDT que corre dentro
 * del OS: no hay una base de datos paralela, solo una puerta de entrada
 * distinta, con su propio gate por membresía activa en la facción.
 */
export default function DepartmentTerminalPage() {
  const params = useParams<{ dept: string }>();
  const department = getDepartment(params.dept);

  const { isLoading: authLoading, isAuthenticated } = useDiscordAuth();
  const [access, setAccess] = useState<AccessState>({ status: 'checking' });

  useEffect(() => {
    if (!department) return;
    if (access.status === 'demo') return;
    if (authLoading) return;
    if (!isAuthenticated) {
      setAccess({ status: 'denied', reason: 'not_logged_in' });
      return;
    }
    let cancelled = false;
    fetch(`/api/terminal/${department.slug}/access`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) { setAccess({ status: 'denied', reason: 'error' }); return; }
        setAccess(data.allowed ? { status: 'allowed' } : { status: 'denied', reason: data.reason });
      })
      .catch(() => { if (!cancelled) setAccess({ status: 'denied', reason: 'error' }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, authLoading, isAuthenticated]);

  if (!department) {
    return <AccessScreen title="Terminal no disponible" message="Todavía no existe una terminal institucional para este departamento." />;
  }

  const enterDemo = () => setAccess({ status: 'demo' });

  if (access.status === 'demo') {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <DepartmentProvider department={department}>
          <MDTProvider>
            <InstitutionalTerminalApp demo />
          </MDTProvider>
        </DepartmentProvider>
      </div>
    );
  }

  if (authLoading || access.status === 'checking') {
    return (
      <div className="h-screen w-screen bg-[#05070d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#6f93d6] animate-spin" />
      </div>
    );
  }

  if (access.status === 'denied') {
    const demoProp = DEMO_ALLOWED ? enterDemo : undefined;
    if (access.reason === 'not_logged_in') {
      return <AccessScreen badge={department.badge} title="Acceso restringido" message={`Iniciá sesión con Discord para acceder a la terminal del ${department.factionAbbreviation}.`} onDemo={demoProp} />;
    }
    if (access.reason === 'not_member' || access.reason === 'faction_missing') {
      return <AccessScreen badge={department.badge} title="Acceso restringido" message={`Esta terminal es solo para miembros activos de ${department.name}. Si creés que esto es un error, contactá a tu superior.`} onDemo={demoProp} />;
    }
    return <AccessScreen badge={department.badge} title="Error de conexión" message="No se pudo verificar tu acceso. Probá de nuevo en unos segundos." onDemo={demoProp} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <DepartmentProvider department={department}>
        <MDTProvider>
          <InstitutionalTerminalApp />
        </MDTProvider>
      </DepartmentProvider>
    </div>
  );
}
