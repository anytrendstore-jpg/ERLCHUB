'use client';

import { useEffect, useState } from 'react';
import { Compass, Film, ShoppingBag } from 'lucide-react';
import type { Profile, SocialView } from './socialhub/types';
import TopBar from './socialhub/TopBar';
import LeftSidebar from './socialhub/LeftSidebar';
import RightSidebar from './socialhub/RightSidebar';
import ChatPanel from './socialhub/ChatPanel';
import FeedTab from './socialhub/FeedTab';
import SavedTab from './socialhub/SavedTab';
import ProfileTab from './socialhub/ProfileTab';
import PagesTab from './socialhub/PagesTab';
import PageDetail from './socialhub/PageDetail';
import GroupsTab from './socialhub/GroupsTab';
import GroupDetail from './socialhub/GroupDetail';
import EventsTab from './socialhub/EventsTab';
import EventDetail from './socialhub/EventDetail';
import ComingSoon from './socialhub/ComingSoon';

/**
 * HubSocial — identidad morada + feed/historias/perfil/páginas/grupos/eventos migrados a
 * componentes propios en socialhub/. Marketplace/Videos llegan en fases siguientes con datos
 * reales — hasta entonces muestran un estado honesto de "Próximamente".
 */
export default function SocialHubApp() {
  const [view, setView] = useState<SocialView>({ mode: 'feed' });
  const [me, setMe] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/social/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMe(d.profile); })
      .catch(() => {});
  }, []);

  const openProfile = (discordId: string) => setView({ mode: 'profile', discordId });
  const openOwnProfile = () => { if (me) openProfile(me.discordId); };
  const openPage = (pageId: string) => setView({ mode: 'page', pageId });
  const openGroup = (groupId: string) => setView({ mode: 'group', groupId });
  const openEvent = (eventId: string) => setView({ mode: 'event', eventId });
  const navigate = (mode: SocialView['mode']) => {
    if (mode === 'profile' || mode === 'page' || mode === 'group' || mode === 'event') return;
    setView({ mode } as SocialView);
  };

  return (
    <div className="relative h-full flex flex-col bg-[#0a0a0f]">
      <TopBar view={view} onNavigate={navigate} me={me} onOpenProfile={openProfile} onOpenOwnProfile={openOwnProfile} />

      <div className="flex-1 flex min-h-0">
        <LeftSidebar me={me} view={view} onNavigate={navigate} onOpenOwnProfile={openOwnProfile} />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view.mode === 'feed' && <FeedTab me={me} onOpenProfile={openProfile} onOpenPage={openPage} />}
          {view.mode === 'saved' && <SavedTab me={me} onOpenProfile={openProfile} onOpenPage={openPage} />}
          {view.mode === 'profile' && (
            <ProfileTab discordId={view.discordId} me={me} onBack={() => setView({ mode: 'feed' })} onUpdatedSelf={setMe} onOpenProfile={openProfile} onOpenPage={openPage} />
          )}
          {view.mode === 'pages' && <PagesTab onOpenPage={openPage} />}
          {view.mode === 'page' && (
            <PageDetail pageId={view.pageId} me={me} onBack={() => setView({ mode: 'pages' })} onOpenProfile={openProfile} />
          )}
          {view.mode === 'explore' && (
            <ComingSoon icon={Compass} title="Explorar llega pronto" text="Una grilla visual con las publicaciones y perfiles más populares de la comunidad." />
          )}
          {view.mode === 'videos' && (
            <ComingSoon icon={Film} title="Videos llega pronto" text="Todavía no hay un formato de video dedicado en HubSocial." />
          )}
          {view.mode === 'marketplace' && (
            <ComingSoon icon={ShoppingBag} title="Marketplace llega pronto" text="Vas a poder ver publicaciones del Marketplace sin salir de HubSocial." />
          )}
          {view.mode === 'groups' && <GroupsTab onOpenGroup={openGroup} />}
          {view.mode === 'group' && (
            <GroupDetail groupId={view.groupId} me={me} onBack={() => setView({ mode: 'groups' })} onOpenProfile={openProfile} onOpenPage={openPage} />
          )}
          {view.mode === 'events' && <EventsTab onOpenEvent={openEvent} />}
          {view.mode === 'event' && (
            <EventDetail eventId={view.eventId} onBack={() => setView({ mode: 'events' })} onOpenProfile={openProfile} />
          )}
        </div>

        <RightSidebar onOpenProfile={openProfile} onOpenPage={openPage} onOpenGroup={openGroup} onOpenEvent={openEvent} />
        <ChatPanel />
      </div>
    </div>
  );
}
