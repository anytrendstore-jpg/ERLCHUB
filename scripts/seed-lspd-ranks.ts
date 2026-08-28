/**
 * Siembra los 15 rangos reales de LSPD (con sueldo semanal) para que la Nómina de Fase B tenga
 * datos reales para pagar. Idempotente: si un rango ya existe por nombre, se salta. No hay tabla
 * oficial de sueldos de ER:LC — progresión propia escalada a la economía de Fase A ($250 efectivo
 * / $2.500 banco iniciales). Reutiliza addFactionRank(), el mismo camino de escritura que ya usa
 * el panel de Facciones Legales — los rangos quedan editables ahí después de correr esto.
 *
 * Uso: npx tsx scripts/seed-lspd-ranks.ts
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

async function main() {
  const { legalFactionsCollection, addFactionRank } = await import('../src/lib/factionsServer');

  const RANKS: { level: number; name: string; salary: number }[] = [
    { level: 1, name: 'Police Officer', salary: 300 },
    { level: 2, name: 'Police Officer II', salary: 375 },
    { level: 3, name: 'Police Officer III', salary: 450 },
    { level: 4, name: 'Police Officer III+1', salary: 525 },
    { level: 5, name: 'Detective I', salary: 600 },
    { level: 6, name: 'Sergeant I', salary: 700 },
    { level: 7, name: 'Sergeant II', salary: 800 },
    { level: 8, name: 'Detective II', salary: 900 },
    { level: 9, name: 'Detective III', salary: 1000 },
    { level: 10, name: 'Lieutenant', salary: 1100 },
    { level: 11, name: 'Captain', salary: 1200 },
    { level: 12, name: 'Commander', salary: 1300 },
    { level: 13, name: 'Deputy Chief', salary: 1400 },
    { level: 14, name: 'Assistant Chief', salary: 1450 },
    { level: 15, name: 'Chief', salary: 1500 },
  ];

  const col = await legalFactionsCollection();
  const existing = await col.findOne({ abbreviation: 'LSPD' });
  let factionId: string;

  if (!existing) {
    console.log('No existe una facción LSPD todavía — creándola...');
    const now = new Date();
    factionId = crypto.randomUUID();
    await col.insertOne({
      id: factionId, name: 'Los Santos Police Department', abbreviation: 'LSPD',
      status: 'operational', ranks: [], members: [], budget: 0, createdAt: now, updatedAt: now,
    });
  } else {
    factionId = existing.id;
  }

  const actor = { id: 'system', name: 'Economy Core — Fase B (seed)' };
  let created = 0;
  let skipped = 0;

  for (const rank of RANKS) {
    const current = await col.findOne({ id: factionId });
    if (!current) throw new Error('La facción LSPD desapareció a mitad de la siembra');
    if (current.ranks.some((r) => r.name === rank.name)) {
      console.log(`Ya existe "${rank.name}" — saltando.`);
      skipped++;
      continue;
    }
    const result = await addFactionRank(current, rank, actor);
    if (!result.success) {
      const errResult = result as { success: false; error: string; status: number };
      console.error(`Error creando "${rank.name}": ${errResult.error}`);
      continue;
    }
    console.log(`Creado: ${rank.name} — $${rank.salary}/semana`);
    created++;
  }

  console.log(`\nListo. Creados: ${created}. Saltados (ya existían): ${skipped}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Error sembrando rangos de LSPD:', error);
  process.exit(1);
});
