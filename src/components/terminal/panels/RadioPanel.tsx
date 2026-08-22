"use client";

import { MDTRadioContent } from "@/components/os/apps/mdt/MDTRadio";

/** Envuelve la consola de radio ya existente — sin recortar funcionalidad, solo el marco cambia. */
export default function RadioPanel() {
  return (
    <div className="h-full overflow-hidden">
      <MDTRadioContent />
    </div>
  );
}
