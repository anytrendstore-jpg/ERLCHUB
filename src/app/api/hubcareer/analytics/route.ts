import { NextRequest, NextResponse } from 'next/server';
import { currentCareerUser, careerProfilesCollection, getConnectionIds } from '@/lib/hubCareerServer';
import { careerPostsCollection } from '@/lib/hubCareerFeedServer';
import { companiesCollection, jobPostingsCollection, applicationsCollection, isCompanyAdmin } from '@/lib/hubCareerJobsServer';

export const dynamic = 'force-dynamic';

function sumReactions(posts: { reactions: Record<string, string[]> }[]): number {
  return posts.reduce((sum, p) => sum + Object.values(p.reactions).reduce((s, arr) => s + arr.length, 0), 0);
}

export async function GET(request: NextRequest) {
  const me = await currentCareerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (companyId) {
      const companiesCol = await companiesCollection();
      const company = await companiesCol.findOne({ id: companyId });
      if (!company) return NextResponse.json({ success: false, error: 'Empresa no encontrada' }, { status: 404 });
      if (!isCompanyAdmin(company, me.id)) return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });

      const [jobsCol, appsCol, postsCol] = await Promise.all([jobPostingsCollection(), applicationsCollection(), careerPostsCollection()]);
      const [jobs, applications, posts] = await Promise.all([
        jobsCol.find({ companyId }).toArray(),
        appsCol.find({ companyId }).toArray(),
        postsCol.find({ authorType: 'company', authorId: companyId }).toArray(),
      ]);

      return NextResponse.json({
        success: true, type: 'company',
        analytics: {
          followers: company.followers.length, employeeCount: company.employeeCount,
          jobsPosted: jobs.length, openJobs: jobs.filter((j) => j.status === 'open').length,
          totalApplications: applications.length,
          postsCount: posts.length, totalReactions: sumReactions(posts),
          totalComments: posts.reduce((s, p) => s + p.commentCount, 0),
        },
      });
    }

    const [profilesCol, postsCol, connections] = await Promise.all([careerProfilesCollection(), careerPostsCollection(), getConnectionIds(me.id)]);
    const profile = await profilesCol.findOne({ discordId: me.id });
    const myPosts = await postsCol.find({ authorType: 'user', authorId: me.id }).toArray();

    return NextResponse.json({
      success: true, type: 'profile',
      analytics: {
        profileViews: profile?.profileViews || 0,
        connections: connections.length,
        postsCount: myPosts.length, totalReactions: sumReactions(myPosts),
        totalComments: myPosts.reduce((s, p) => s + p.commentCount, 0),
        totalShares: myPosts.reduce((s, p) => s + p.shareCount, 0),
      },
    });
  } catch (error) {
    console.error('Error leyendo analíticas de HubCareer:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
