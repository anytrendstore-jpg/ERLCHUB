import { NextRequest, NextResponse } from 'next/server';
import { applications, isStaffSession, nextMemberNumber, toPublicApplication } from '@/lib/whitelistServer';
import { logStaffAction, staffIdentity, type StaffActionType } from '@/lib/staffServer';
import type { ApplicationStatus } from '@/lib/whitelistTypes';

export const dynamic = 'force-dynamic';

const forbidden = () =>
  NextResponse.json({ success: false, error: 'Necesitas iniciar sesión como staff' }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!isStaffSession()) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const col = await applications();
    const query: Record<string, unknown> = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { fullName: rx },
        { email: rx },
        { applicationId: rx },
        { 'discord.username': rx },
        { 'roblox.username': rx },
      ];
    }

    const docs = await col.find(query).sort({ submittedAt: -1, createdAt: -1 }).limit(200).toArray();

    const counts = await col
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray();
    const byStatus = counts.reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      applications: docs.map(toPublicApplication),
      stats: {
        total: await col.countDocuments({}),
        pending: byStatus.pending || 0,
        in_review: byStatus.in_review || 0,
        approved: byStatus.approved || 0,
        rejected: byStatus.rejected || 0,
        needs_revision: byStatus.needs_revision || 0,
      },
    });
  } catch (error) {
    console.error('Error listando solicitudes:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo conectar con la base de datos' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isStaffSession()) return forbidden();

  try {
    const { applicationId, status, staffNotes, reviewedBy, action, interviewNotes } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Falta la solicitud' }, { status: 400 });
    }

    const col = await applications();
    const application = await col.findOne({ applicationId });
    if (!application) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (action === 'request_interview') {
      const identity = staffIdentity();
      await col.updateOne(
        { applicationId },
        { $set: { interviewRequested: true, interviewRequestedAt: new Date(), interviewRequestedBy: identity?.name || reviewedBy || 'Staff', interviewNotes: interviewNotes?.trim() || application.interviewNotes, updatedAt: new Date() } }
      );
      await logStaffAction({
        type: 'whitelist_interview_requested', category: 'WL', actor: identity?.name || 'Staff', actorId: identity?.id,
        target: application.fullName, targetId: application.applicationId,
        description: `${identity?.name || 'Staff'} solicitó una entrevista a ${application.fullName}`,
      });
      const freshInterview = await col.findOne({ applicationId });
      return NextResponse.json({ success: true, application: toPublicApplication(freshInterview!) });
    }

    const allowed: ApplicationStatus[] = ['pending', 'in_review', 'approved', 'rejected', 'needs_revision'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ success: false, error: 'Datos de revisión no válidos' }, { status: 400 });
    }

    // La fase acompaña a la decisión — y depende de CUÁL revisión es esta: la del
    // cuestionario (fase 'review') o la del documento/personaje (fase 'dni_review').
    const isDniReview = application.currentPhase === 'dni_review';
    const currentPhase = isDniReview
      ? status === 'approved'
        ? 'completed'
        : status === 'needs_revision' || status === 'rejected'
          ? 'dni'
          : 'dni_review'
      : status === 'approved'
        ? 'dni'
        : status === 'needs_revision'
          ? 'questionnaire'
          : application.currentPhase === 'completed'
            ? 'completed'
            : 'review';

    const setFields: Record<string, unknown> = {
      status,
      currentPhase,
      staffNotes: staffNotes ?? application.staffNotes,
      reviewedBy: reviewedBy || 'Staff',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
    const unsetFields: Record<string, ''> = {};

    if (isDniReview && status === 'approved') {
      // Recién acá se asigna el número de miembro — no tiene sentido gastar uno en un
      // personaje que todavía podía terminar rechazado.
      setFields.memberNumber = application.memberNumber ?? (await nextMemberNumber());
      setFields.completedAt = application.completedAt || new Date();
    }
    if (isDniReview && (status === 'needs_revision' || status === 'rejected')) {
      // El documento generado queda inválido — el personaje (nombre, fecha de nacimiento,
      // etc.) se conserva para que el jugador no tenga que volver a tipear todo, pero el
      // documento en sí (con su ID de ciudadano ya asignado) se descarta y se genera uno
      // nuevo recién cuando reenvíe.
      unsetFields.document = '';
    }

    await col.updateOne(
      { applicationId },
      {
        $set: setFields,
        ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}),
      }
    );

    const fresh = await col.findOne({ applicationId });

    const identity = staffIdentity();
    const actionByStatus: Record<ApplicationStatus, StaffActionType> = {
      approved: 'whitelist_approved',
      rejected: 'whitelist_rejected',
      needs_revision: 'whitelist_revision',
      in_review: 'whitelist_in_review',
      pending: 'whitelist_in_review',
    };
    const labelByStatus: Record<ApplicationStatus, string> = {
      approved: 'aprobó', rejected: 'rechazó', needs_revision: 'pidió correcciones a',
      in_review: 'puso en revisión a', pending: 'devolvió a pendiente a',
    };
    await logStaffAction({
      type: actionByStatus[status as ApplicationStatus],
      category: 'WL',
      actor: identity?.name || reviewedBy || 'Staff',
      actorId: identity?.id,
      target: application.fullName,
      targetId: application.applicationId,
      description: `${identity?.name || reviewedBy || 'Staff'} ${labelByStatus[status as ApplicationStatus]} ${isDniReview ? 'el documento de identidad de' : 'la solicitud de'} ${application.fullName}`,
    });

    return NextResponse.json({ success: true, application: toPublicApplication(fresh!) });
  } catch (error) {
    console.error('Error revisando solicitud:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo guardar la revisión' },
      { status: 500 }
    );
  }
}
