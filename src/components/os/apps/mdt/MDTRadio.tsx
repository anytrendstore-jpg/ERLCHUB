"use client";

import MDTLayout from "./MDTLayout";
import RadioApp from "@/components/os/apps/RadioApp";

export function MDTRadioContent() {
  return (
    <>
      <div className="h-full overflow-hidden border-t border-[#151d31]">
        <RadioApp />
      </div>
    </>
  );
}

export default function MDTRadio() {
  return (
    <MDTLayout title="Radio" subtitle="Comunicación por canales y frecuencias" fullBleed>
      <MDTRadioContent />
    </MDTLayout>
  );
}
