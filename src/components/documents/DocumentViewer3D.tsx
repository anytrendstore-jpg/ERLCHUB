"use client";

import { LICENSE_LAYOUTS, RESIDENCE_CARD_LAYOUT } from "@/lib/documentLayouts";
import type { City, DocumentType } from "@/lib/whitelistTypes";
import type { DocumentFieldValues } from "./buildDocumentTexture";
import DocumentCard2D from "./DocumentCard2D";
import PassportBook2D from "./PassportBook2D";

export interface DocumentViewer3DProps {
  documentType: DocumentType;
  city: City;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  gender: "male" | "female" | "other" | "";
  height: string;
  nationality: string;
  group: string;
  robloxUsername: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  photoUrl?: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "--/--/----";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function genderLabel(gender: string) {
  if (gender === "male") return "Masculino";
  if (gender === "female") return "Femenino";
  return "Otro";
}

export default function DocumentViewer3D(props: DocumentViewer3DProps) {
  const isPassport = props.documentType === "passport" || props.documentType === "passport_1" || props.documentType === "passport_2";
  // La licencia tiene una sola etiqueta "FECHA Y LUGAR DE EXPEDICIÓN" (un valor combinado);
  // la residencia y el pasaporte separan "EMITIDO EL" / "EXPIRA EL" / "LUGAR DE EXPEDICIÓN".
  const isCombinedIssueRow = !isPassport && props.documentType !== "residence_card";

  const values: DocumentFieldValues = {
    firstName: props.firstName,
    lastName: props.lastName,
    birthPlace: props.birthPlace,
    sex: genderLabel(props.gender),
    height: props.height,
    group: props.group,
    birthDate: formatDate(props.birthDate),
    issuedAt: isCombinedIssueRow
      ? (props.issueDate ? `${props.issueDate} · ${props.birthPlace}` : props.birthPlace)
      : props.issueDate,
    issuePlace: props.birthPlace,
    expiryDate: props.expiryDate,
    robloxUsername: props.robloxUsername ? `@${props.robloxUsername}` : "",
    nationality: props.nationality,
    documentNumber: props.documentNumber,
  };

  if (isPassport) {
    return <PassportBook2D values={values} photoUrl={props.photoUrl} />;
  }

  const layout = props.documentType === "residence_card" ? RESIDENCE_CARD_LAYOUT : LICENSE_LAYOUTS[props.city];

  return <DocumentCard2D layout={layout} values={values} photoUrl={props.photoUrl} documentNumber={props.documentNumber} />;
}
