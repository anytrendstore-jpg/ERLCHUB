"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEPARTMENTS, type DepartmentConfig } from "@/lib/departments";

const DepartmentContext = createContext<DepartmentConfig>(DEPARTMENTS.lspd);

/** Envuelve el MDT para que MDTLayout sepa qué escudo/nombre de dependencia mostrar. */
export function DepartmentProvider({ department, children }: { department: DepartmentConfig; children: ReactNode }) {
  return <DepartmentContext.Provider value={department}>{children}</DepartmentContext.Provider>;
}

export function useDepartment(): DepartmentConfig {
  return useContext(DepartmentContext);
}
