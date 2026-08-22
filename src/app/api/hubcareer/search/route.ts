import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, careerProfilesCollection } from '@/lib/hubCareerServer';
import { companiesCollection, jobPostingsCollection } from '@/lib/hubCareerJobsServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Búsqueda global: personas, empresas y empleos. Las personas se resuelven vía el índice de perfiles ya existente de HubSocial (mismo directorio de jugadores en todo el ecosistema). */
export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ success: true, people: [], companies: [], jobs: [] });

    const [socialCol, companiesCol, jobsCol, profilesCol] = await Promise.all([
      socialProfilesCollection(), companiesCollection(), jobPostingsCollection(), careerProfilesCollection(),
    ]);

    const peopleDocs = await socialCol
      .find({ $or: [{ username: { $regex: q, $options: 'i' } }, { displayName: { $regex: q, $options: 'i' } }] })
      .limit(15).toArray();
    const careerProfiles = await profilesCol.find({ discordId: { $in: peopleDocs.map((p) => p.discordId) } }).toArray();
    const headlineById = new Map(careerProfiles.map((p) => [p.discordId, p.headline]));
    const people = peopleDocs.map((d) => ({
      discordId: d.discordId, name: d.displayName || d.username, avatar: d.avatarUrl || d.avatar,
      headline: headlineById.get(d.discordId) || '',
    }));

    const companyDocs = await companiesCol.find({ name: { $regex: q, $options: 'i' } }).limit(15).toArray();
    const companies = companyDocs.map(({ _id, ...c }: any) => c);

    const jobDocs = await jobsCol.find({ status: 'open', title: { $regex: q, $options: 'i' } }).limit(15).toArray();
    const jobs = jobDocs.map(({ _id, ...j }: any) => j);

    return NextResponse.json({ success: true, people, companies, jobs });
  } catch (error) {
    console.error('Error en búsqueda global de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo buscar' }, { status: 500 });
  }
}
