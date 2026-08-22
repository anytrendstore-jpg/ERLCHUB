import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { getDepartment } from '@/lib/departments';
import {
  legalFactionsCollection, findOwnMembership,
  addFactionMember, removeFactionMember, changeFactionMemberRank, addFactionRank, updateFactionRank, deleteFactionRank,
} from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Nivel de FactionRank a partir del cual un miembro puede administrar su propia facción desde la terminal. */
const COMMAND_LEVEL = 4;

/**
 * Administración de facción desde la propia terminal — mismas mutaciones
 * que /api/staff/factions, pero el gate acá es "alto mando real de esta
 * facción" (rango propio dentro de faction.members), no permiso de Staff
 * del sitio. No se toca la ruta de Staff, que sigue intacta para moderación.
 */
async function resolveContext(deptSlug: string) {
  const department = getDepartment(deptSlug);
  if (!department) return { error: NextResponse.json({ success: false, error: 'Departamento desconocido' }, { status: 404 }) };

  const user = currentDiscordUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }) };

  const col = await legalFactionsCollection();
  const faction = await col.findOne({ abbreviation: department.factionAbbreviation });
  if (!faction) return { error: NextResponse.json({ success: false, error: 'La facción todavía no existe' }, { status: 404 }) };

  const { member, rank } = findOwnMembership(faction, user.id);
  if (!member || member.status !== 'active') {
    return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de esta facción' }, { status: 403 }) };
  }

  return { department, user, col, faction, member, rank };
}

export async function GET(request: NextRequest, { params }: { params: { dept: string } }) {
  const ctx = await resolveContext(params.dept);
  if ('error' in ctx) return ctx.error;
  const { faction, rank } = ctx;

  const { _id, ...clean } = faction as any;
  return NextResponse.json({ success: true, faction: clean, myRankLevel: rank?.level ?? 0, commandLevel: COMMAND_LEVEL });
}

export async function PATCH(request: NextRequest, { params }: { params: { dept: string } }) {
  const ctx = await resolveContext(params.dept);
  if ('error' in ctx) return ctx.error;
  const { faction, rank, user } = ctx;

  if (!rank || rank.level < COMMAND_LEVEL) {
    return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para administrar la facción` }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const actor = { id: user.id, name: user.global_name || user.username };

    const result = await (async () => {
      switch (action) {
        case 'add_member': return addFactionMember(faction, body, actor);
        case 'remove_member': return removeFactionMember(faction, body, actor);
        case 'change_member_rank': return changeFactionMemberRank(faction, body, actor);
        case 'add_rank': return addFactionRank(faction, body, actor);
        case 'update_rank': return updateFactionRank(faction, body, actor);
        case 'delete_rank': return deleteFactionRank(faction, body, actor);
        default: return { success: false as const, error: 'Acción desconocida', status: 400 };
      }
    })();

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error administrando facción desde la terminal:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
