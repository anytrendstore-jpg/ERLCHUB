"use client";

import { Construction } from "lucide-react";
import { PanelHeader, Card } from "@/components/staff/ui";

/**
 * Módulos que aparecen en el menú porque forman parte de la estructura del
 * panel, pero todavía no tienen un sistema real detrás (no hay negocios,
 * facciones ni bandas modeladas en la base de datos). Se marca honestamente
 * como "en construcción" en vez de simular datos.
 */
export default function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <PanelHeader title={title} subtitle={description} />
      <Card className="p-16 text-center">
        <Construction className="h-10 w-10 text-slate-700 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-1">Módulo en construcción</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Este apartado está reservado en la navegación, pero todavía no tiene un sistema
          conectado a la base de datos. Se activará cuando el servidor defina cómo debe
          funcionar.
        </p>
      </Card>
    </div>
  );
}
