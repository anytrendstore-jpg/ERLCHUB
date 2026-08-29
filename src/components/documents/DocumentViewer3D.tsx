"use client";

import { LICENSE_LAYOUTS, RESIDENCE_CARD_LAYOUT } from "@/lib/documentLayouts";
import { CITIES, type City, type DocumentType } from "@/lib/whitelistTypes";
import type { DocumentFieldValues } from "./buildDocumentTexture";
import DocumentCard2D from "./DocumentCard2D";
import PassportBook2D from "./PassportBook2D";

export interface DocumentViewer3DProps {
  documentType: DocumentType;
  city: City;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "male" | "female" | "other" | "";
  height: string;
  nationality: string;
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

  // El documento lo expide la ciudad que el jugador eligió (donde tramitó la licencia).
  const issuingCity = CITIES.find((c) => c.id === props.city)?.name || props.city;

  const values: DocumentFieldValues = {
    firstName: props.firstName,
    lastName: props.lastName,
    sex: genderLabel(props.gender),
    height: props.height,
    birthDate: formatDate(props.birthDate),
    issuedAt: isCombinedIssueRow
      ? (props.issueDate ? `${props.issueDate} · ${issuingCity}` : issuingCity)
      : props.issueDate,
    issuePlace: issuingCity,
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
