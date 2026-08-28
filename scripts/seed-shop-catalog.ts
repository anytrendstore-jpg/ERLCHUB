/**
 * Migra el contenido actual de src/lib/shopData.ts (memberships, kits, whitelistFastKit,
 * hubCoinsPackages, shopItems) al catálogo real en Mongo (shop_catalog). Idempotente por id
 * — no pisa ediciones ya hechas desde el panel admin en corridas posteriores.
 *
 * Uso: npx tsx scripts/seed-shop-catalog.ts
 */
import fs from 'fs';
import path from 'path';

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
  const { shopCatalogCollection } = await import('../src/lib/shopCatalogServer');
  const { memberships, kits, whitelistFastKit, hubCoinsPackages, shopItems } = await import('../src/lib/shopData');

  const col = await shopCatalogCollection();
  const existingIds = new Set((await col.find({}, { projection: { id: 1 } }).toArray()).map((d) => d.id));
  const now = new Date();
  const actor = 'system';
  let created = 0;
  let skipped = 0;

  const docs: any[] = [
    ...memberships.map((m, i) => ({ ...m, type: 'membership', active: true, sortOrder: i })),
    ...kits.map((k, i) => ({ ...k, type: 'kit', active: true, sortOrder: i })),
    { ...whitelistFastKit, type: 'whitelist-fast', active: true },
    ...hubCoinsPackages.map((h, i) => ({ ...h, type: 'hub-coins-package', active: true, sortOrder: i })),
    ...shopItems.map((s, i) => ({ ...s, type: 'item', itemType: s.type, active: true, sortOrder: i })),
  ];

  for (const doc of docs) {
    if (existingIds.has(doc.id)) {
      console.log(`Ya existe "${doc.id}" — saltando.`);
      skipped++;
      continue;
    }
    await col.insertOne({ ...doc, createdAt: now, updatedAt: now, updatedBy: actor });
    console.log(`Creado: ${doc.id} (${doc.type})`);
    created++;
  }

  console.log(`\nListo. Creados: ${created}. Saltados (ya existían): ${skipped}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Error sembrando el catálogo de tienda:', error);
  process.exit(1);
});
