import { NextRequest, NextResponse } from 'next/server';
import {
  applications,
  betaMode,
  currentApplication,
  generateCityDocumentId,
  generateDocumentNumber,
  generateRobloxCode,
  scoreQuestionnaire,
  toPublicApplication,
  validateQuestionnaire,
  type WhitelistApplication,
} from '@/lib/whitelistServer';
import { QUESTIONNAIRE_QUESTIONS, type WhitelistPhase } from '@/lib/whitelistTypes';

export const dynamic = 'force-dynamic';

const noSession = () =>
  NextResponse.json({ success: false, error: 'No hay ninguna solicitud abierta' }, { status: 401 });

/* ------------------------------------------------------------------ *
 * Roblox: consulta real con degradación elegante si no hay salida a red
 * ------------------------------------------------------------------ */

async function robloxRequest(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // sin red / bloqueado por proxy: el llamador decide el plan B
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupRobloxUser(username: string) {
  const data = await robloxRequest('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
  });

  const user = data?.data?.[0];
  if (!user) return null;

  const avatarData = await robloxRequest(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
  );

  return {
    id: String(user.id),
    username: user.name as string,
    displayName: (user.displayName || user.name) as string,
    avatar: avatarData?.data?.[0]?.imageUrl as string | undefined,
  };
}

async function robloxDescriptionHasCode(userId: string, code: string) {
  const info = await robloxRequest(`https://users.roblox.com/v1/users/${userId}`);
  if (!info) return null; // no se pudo comprobar
  return String(info.description || '').toUpperCase().includes(code.toUpperCase());
}

/* ------------------------------------------------------------------ *
 * GET — estado actual de la solicitud
 * ------------------------------------------------------------------ */

export async function GET() {
  try {
    const application = await currentApplication();
    if (!application) return noSession();

    const col = await applications();

    let queue: { position: number; total: number } | null = null;
    if (application.currentPhase === 'review' && application.submittedAt) {
      const total = await col.countDocuments({
        currentPhase: 'review',
        status: { $in: ['pending', 'in_review'] },
      });
      const ahead = await col.countDocuments({
        currentPhase: 'review',
        status: { $in: ['pending', 'in_review'] },
        submittedAt: { $lt: application.submittedAt },
      });
      queue = { position: ahead + 1, total };
    }

    return NextResponse.json({
      success: true,
      application: toPublicApplication(application),
      queue,
    });
  } catch (error) {
    console.error('Error leyendo la solicitud:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar con la base de datos' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ *
 * PATCH — avanzar el proceso
 * ------------------------------------------------------------------ */

export async function PATCH(request: NextRequest) {
  try {
    const application = await currentApplication();
    if (!application) return noSession();

    const { action, data = {} } = await request.json();
    const col = await applications();
    const now = new Date();

    // Los campos con valor `undefined` se borran del documento en vez de
    // guardarse como null (importante para reiniciar fases).
    const save = async (update: Partial<WhitelistApplication>) => {
      const $set: Record<string, unknown> = { updatedAt: now };
      const $unset: Record<string, ''> = {};

      for (const [key, value] of Object.entries(update)) {
        if (value === undefined) $unset[key] = '';
        else $set[key] = value;
      }

      await col.updateOne(
        { applicationId: application.applicationId },
        Object.keys($unset).length ? { $set, $unset } : { $set }
      );

      const fresh = await col.findOne({ applicationId: application.applicationId });
      return NextResponse.json({ success: true, application: toPublicApplication(fresh!) });
    };

    switch (action) {
      /* ---------------- Discord ---------------- */
      case 'discord_requirement': {
        const requirement = data.requirement;
        if (requirement !== 'server' && requirement !== 'rules') {
          return NextResponse.json({ success: false, error: 'Requisito no válido' }, { status: 400 });
        }
        if (requirement === 'rules' && !application.discord.joinedServer) {
          return NextResponse.json(
            { success: false, error: 'Primero debes unirte al servidor' },
            { status: 400 }
          );
        }

        const discord = {
          ...application.discord,
          joinedServer: requirement === 'server' ? true : application.discord.joinedServer,
          acceptedRules: requirement === 'rules' ? true : application.discord.acceptedRules,
        };

        const complete = discord.joinedServer && discord.acceptedRules;
        return save({
          discord,
          ...(complete && application.currentPhase === 'discord' ? { currentPhase: 'roblox' as const } : {}),
        });
      }

      /* ---------------- Roblox ---------------- */
      case 'roblox_start': {
        const username = String(data.username || '').trim();
        if (!username) {
          return NextResponse.json({ success: false, error: 'Escribe tu usuario de Roblox' }, { status: 400 });
        }

        const found = await lookupRobloxUser(username);
        // Si la API de Roblox no responde (proxy/red), seguimos con el nombre tal cual.
        const taken = await col.findOne({
          applicationId: { $ne: application.applicationId },
          'roblox.username': found?.username || username,
          'roblox.verified': true,
        });
        if (taken) {
          return NextResponse.json(
            { success: false, error: 'Esa cuenta de Roblox ya está vinculada a otra solicitud' },
            { status: 409 }
          );
        }

        return save({
          roblox: {
            id: found?.id,
            username: found?.username || username,
            displayName: found?.displayName || username,
            avatar: found?.avatar,
            verificationCode: application.roblox?.verificationCode || generateRobloxCode(),
            verified: false,
          },
        });
      }

      case 'roblox_verify': {
        const roblox = application.roblox;
        if (!roblox) {
          return NextResponse.json({ success: false, error: 'Busca tu usuario primero' }, { status: 400 });
        }

        let mode: 'api' | 'offline' = 'offline';
        if (roblox.id) {
          const hasCode = await robloxDescriptionHasCode(roblox.id, roblox.verificationCode);
          if (hasCode === true) {
            mode = 'api';
          } else if (hasCode === false) {
            return NextResponse.json(
              {
                success: false,
                error: 'Todavía no encontramos el código en la descripción de tu perfil de Roblox',
              },
              { status: 400 }
            );
          }
          // hasCode === null → no se pudo consultar: se acepta en modo local
        }

        return save({
          roblox: { ...roblox, verified: true, verifiedMode: mode, connectedAt: now },
          ...(application.currentPhase === 'roblox' ? { currentPhase: 'questionnaire' as const } : {}),
        });
      }

      case 'roblox_reset':
        return save({ roblox: undefined, currentPhase: 'roblox' });

      /* ---------------- Cuestionario ---------------- */
      case 'questionnaire_save':
        return save({ questionnaireDraft: (data.answers || {}) as Record<string, string> });

      case 'questionnaire_submit': {
        const answers = (data.answers || {}) as Record<string, string>;
        const problem = validateQuestionnaire(answers);
        if (problem) {
          return NextResponse.json({ success: false, error: problem }, { status: 400 });
        }

        const questionnaire = QUESTIONNAIRE_QUESTIONS.map((question) => ({
          questionId: question.id,
          question: question.question,
          answer: (answers[question.id] || '').trim(),
        }));

        return save({
          questionnaire,
          questionnaireDraft: answers,
          questionnaireScore: scoreQuestionnaire(answers),
          currentPhase: 'review',
          status: 'pending',
          submittedAt: now,
          staffNotes: undefined,
          reviewedAt: undefined,
          reviewedBy: undefined,
        });
      }

      /* ---------------- DNI ---------------- */
      case 'character_submit': {
        if (application.status !== 'approved' || application.currentPhase !== 'dni') {
          return NextResponse.json(
            { success: false, error: 'Tu solicitud todavía no está aprobada' },
            { status: 403 }
          );
        }

        const character = data.character || {};
        const required = ['firstName', 'lastName', 'birthDate', 'birthPlace', 'gender', 'height', 'nationality', 'group', 'city'];
        const missing = required.filter((field) => !String(character[field] || '').trim());
        if (missing.length) {
          return NextResponse.json(
            { success: false, error: `Faltan campos del personaje: ${missing.join(', ')}` },
            { status: 400 }
          );
        }

        const birthDate = new Date(character.birthDate);
        const age = (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (Number.isNaN(birthDate.getTime()) || age < 18) {
          return NextResponse.json(
            { success: false, error: 'El personaje debe tener al menos 18 años' },
            { status: 400 }
          );
        }

        const issue = now;
        const expiry = new Date(now);
        expiry.setFullYear(expiry.getFullYear() + 5);
        const number = generateCityDocumentId(character.city);

        const memberNumber =
          application.memberNumber ?? (await col.countDocuments({ currentPhase: 'completed' })) + 1;

        return save({
          character,
          document: {
            type: data.documentType || 'license',
            number,
            issueDate: issue.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            expiryDate: expiry.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            qrCode: `https://erlchub.pro/verify/${number}`,
            securityCode: generateDocumentNumber('SEC'),
            generatedAt: now,
          },
          memberNumber,
          currentPhase: 'completed',
          completedAt: now,
        });
      }

      /* ---------------- Modo beta ---------------- */
      case 'beta_goto': {
        if (!betaMode) {
          return NextResponse.json({ success: false, error: 'El modo beta está desactivado' }, { status: 403 });
        }

        const phase = data.phase as WhitelistPhase;
        if (!phase || !(phase in { discord: 1, roblox: 1, questionnaire: 1, review: 1, dni: 1, completed: 1 })) {
          return NextResponse.json({ success: false, error: 'Fase no válida' }, { status: 400 });
        }

        // Rellena lo mínimo de las fases anteriores para que la fase destino
        // tenga datos coherentes que mostrar.
        const order: WhitelistPhase[] = ['discord', 'roblox', 'questionnaire', 'review', 'dni', 'completed'];
        const target = order.indexOf(phase);
        const update: Partial<WhitelistApplication> = { currentPhase: phase };

        const done = (p: WhitelistPhase) => order.indexOf(p) < target;

        update.discord = {
          ...application.discord,
          joinedServer: done('discord') ? true : application.discord.joinedServer,
          acceptedRules: done('discord') ? true : application.discord.acceptedRules,
        };

        if (done('roblox')) {
          update.roblox = application.roblox
            ? { ...application.roblox, verified: true, verifiedMode: application.roblox.verifiedMode || 'offline', connectedAt: application.roblox.connectedAt || now }
            : {
                username: `beta_${application.discord.username}`.slice(0, 20),
                displayName: application.discord.globalName || application.discord.username,
                verificationCode: generateRobloxCode(),
                verified: true,
                verifiedMode: 'offline',
                connectedAt: now,
              };
        } else if (phase === 'roblox') {
          update.roblox = undefined;
        }

        if (done('questionnaire')) {
          const answers =
            application.questionnaireDraft ||
            Object.fromEntries(
              QUESTIONNAIRE_QUESTIONS.map((q) => [
                q.id,
                q.options?.[0] ||
                  `[Modo beta] Respuesta de ejemplo para revisar el flujo. ${'Contenido de relleno con longitud suficiente para pasar la validación. '.repeat(6)}`.slice(
                    0,
                    Math.max(q.minLength || 100, 120)
                  ),
              ])
            );

          update.questionnaire = QUESTIONNAIRE_QUESTIONS.map((q) => ({
            questionId: q.id,
            question: q.question,
            answer: answers[q.id],
          }));
          update.questionnaireDraft = answers;
          update.questionnaireScore = application.questionnaireScore ?? scoreQuestionnaire(answers);
          update.submittedAt = application.submittedAt || now;
        }

        // El estado acompaña a la fase destino.
        if (phase === 'review') update.status = 'pending';
        if (phase === 'dni' || phase === 'completed') update.status = 'approved';

        if (phase === 'completed') {
          const expiry = new Date(now);
          expiry.setFullYear(expiry.getFullYear() + 5);
          const number = application.document?.number || generateCityDocumentId(application.character?.city || 'los_santos');

          update.character = application.character || {
            firstName: 'Beta',
            lastName: 'Tester',
            birthDate: '1998-01-01',
            birthPlace: 'Los Santos',
            gender: 'other',
            height: '1.71m - 1.75m',
            nationality: 'Mexicano',
            group: 'Ciudadano',
            city: 'los_santos',
          };
          update.document = application.document || {
            type: 'california_license',
            number,
            issueDate: now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            expiryDate: expiry.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            qrCode: `https://erlchub.pro/verify/${number}`,
            securityCode: generateDocumentNumber('SEC'),
            generatedAt: now,
          };
          update.memberNumber =
            application.memberNumber ?? (await col.countDocuments({ currentPhase: 'completed' })) + 1;
          update.completedAt = application.completedAt || now;
        }

        return save(update);
      }

      case 'beta_reset': {
        if (!betaMode) {
          return NextResponse.json({ success: false, error: 'El modo beta está desactivado' }, { status: 403 });
        }
        return save({
          currentPhase: 'discord',
          status: 'pending',
          discord: { ...application.discord, joinedServer: false, acceptedRules: false },
          roblox: undefined,
          questionnaire: undefined,
          questionnaireDraft: undefined,
          questionnaireScore: undefined,
          submittedAt: undefined,
          reviewedAt: undefined,
          reviewedBy: undefined,
          staffNotes: undefined,
          character: undefined,
          document: undefined,
          memberNumber: undefined,
          completedAt: undefined,
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error actualizando la solicitud:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo guardar el cambio en la base de datos' },
      { status: 500 }
    );
  }
}
