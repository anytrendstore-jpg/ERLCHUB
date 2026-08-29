"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";
import CountUpStat from "@/components/CountUpStat";
import {
  ChevronRight, Shield, Headphones, Star, MessageSquare,
  Gamepad2, UserCheck, FileCheck, Users,
  Instagram, Youtube, ChevronDown, Globe, LayoutDashboard, ClipboardCheck,
  ShoppingBag, Coins, Crown, Package, Quote,
} from "lucide-react";
import { useHomeReviews } from "@/hooks/useHomeReviews";
import { useReviews } from "@/hooks/useReviews";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useWhitelistStatus } from "@/hooks/useWhitelistStatus";
import { useTiendaStats } from "@/hooks/useTiendaStats";
import { useRouter } from "next/navigation";
import { useCardTilt } from "@/hooks/useCardTilt";
import ProductCard from "@/components/tienda/ProductCard";
import { memberships, kits, hubCoinsPackages, currencies, convertPrice, formatNumber } from "@/lib/shopData";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const features = [
  { icon: Users, label: "Comunidad activa" },
  { icon: FileCheck, label: "Economia Interna" },
  { icon: Gamepad2, label: "Roleplay Avanzado" },
  { icon: Users, label: "Soporte 24/7" },
];

const playSteps = [
  {
    number: "1",
    title: "Únete a Discord",
    subtitle: "Crea tu cuenta",
    description: "Descarga Discord y únete a nuestro servidor para comenzar.",
    icon: DiscordIcon,
    color: "#8e00f7",
  },
  {
    number: "2",
    title: "Completa la Whitelist",
    subtitle: "Verificación",
    description: "Pasa nuestro proceso de whitelist para garantizar una comunidad de calidad.",
    icon: UserCheck,
    color: "#22c55e",
  },
  {
    number: "3",
    title: "Obtén tu DNI",
    subtitle: "Documentación",
    description: "Genera tu documento de identidad y únete a la mejor experiencia de roleplay.",
    icon: FileCheck,
    color: "#f59e0b",
  },
];

const teamMembers = [
  {
    name: "Nicolas Torres",
    role: "CEO & Fundador",
    description: "Visionario y fundador del servidor, encargado de liderar su completo crecimiento y consolidación, así definiendo la estrategia, el área de marketing y la toma de decisiones clave que marcan la dirección y la esencia del proyecto. Responsable de establecer los valores, bases y objetivos que guían su desarrollo, asegurando un crecimiento sólido y el éxito total a muy largo plazo.",
    avatar: "/team/nicolas-torres.jpg", 
    avatarFallback: "CEO",
    color: "#8e00f7",
    socials: { 
      instagram: "https://www.instagram.com/sr_.nb?igsh=bW94enF4ZWxxcmlv",
      discord: "https://discord.gg/xKJqNX7uC3"
    },
  },
  {
    name: "Isaac Marin",
    role: " Socio & Communications Officer",
    description: "Encargado de fortalecer la presencia y la imagen del servidor, definiendo estrategias que impulsan su crecimiento. Gestiona la interacción con la comunidad y coordina la comunicación del proyecto. Actúa como puente entre el equipo y los usuarios, asegurando que los valores, objetivos y mensajes se transmitan de forma clara y coherente.",
    avatar: "/team/mode.jpg", 
    avatarFallback: "SCO", 
    color: "#ec4899",
    socials: { 
      instagram: "https://www.instagram.com/isaac___.09?igsh=YTZycXU2cW1vdjk0",
      discord: "https://discord.gg/xKJqNX7uC3"
    },
  },
  {
    name: "Lucas Cabaña",
    role: "Socio & Director",
    description: "Socio y Director, encargado de liderar la comunidad y supervisar la experiencia de roleplay en el servidor. Responsable de fomentar la participación, mantener la interacción activa y garantizar que el ambiente de juego refleje los valores y la escencia del proyecto promoviendo un espacio dinámico y envolvente para todos los miembros.",
    avatar: "/team/lucas.png", 
    avatarFallback: "S&D", 
    color: "#22c55e",
    socials: { 
      instagram: "https://www.instagram.com/lucaxscabs?igsh=cWZ0ZmUwOTY1cHJr",
      discord: "https://discord.gg/xKJqNX7uC3"
    },
  },
  {
    name: "Miguel Riascos",
    role: "Systems Lead",
    description: "Encargado del desarrollo y de la optimización de los sistemas del proyecto, liderando la ejecución de soluciones tecnológicas que son eficientes y escalables. Él supervisa el funcionamiento del sistema, asegurando estabilidad, rendimiento y mejora continua. Contribuyendo a su crecimiento y evolución constante dentro de todos los sistemas de ERLCᴴᵁᴮ.",
    avatar: "/team/miguel.png", 
    avatarFallback: "SL", 
    color: "#3b82f6",
    socials: { 
      instagram: "https://www.instagram.com/castrillonriascos22/",
      discord: "https://discord.gg/xKJqNX7uC3"
    },
  },
];

const servers = [
  { id: "los-santos", name: "Los Santos", description: "La ciudad principal con todo tipo de actividades", maxPlayers: 50, color: "#8e00f7", comingSoon: false },
  { id: "liberty-city", name: "Liberty City", description: "Ambiente urbano con rascacielos y negocios", maxPlayers: 50, color: "#3b82f6", comingSoon: true },
  { id: "vice-city", name: "Vice City", description: "Estilo retro con playas y vida nocturna", maxPlayers: 50, color: "#22c55e", comingSoon: true },
  { id: "las-venturas", name: "Las Venturas", description: "La ciudad del entretenimiento y los casinos", maxPlayers: 50, color: "#ef4444", comingSoon: true },
];

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(50px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useDiscordAuth();
  const router = useRouter();
  const whitelist = useWhitelistStatus();
  const { stats: tiendaStats } = useTiendaStats();
  const { reviews: allReviews, stats: allReviewStats, loading: reviewsLoading } = useReviews("Todas");

  const { stats: reviewStats } = useHomeReviews();

  const communityRating = reviewStats.comunidad.avgRating > 0 ? reviewStats.comunidad.avgRating.toFixed(1) : "0";
  const [serverStatus, setServerStatus] = useState({ online: 0, max: 40 });
  const [serverPlayers, setServerPlayers] = useState<Record<string, number>>({});
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  // Sin solicitud -> hacerla · a medias -> continuar · terminada -> su dashboard (misma lógica del Navbar).
  const primaryAction = whitelist.completed
    ? { href: "/dashboard", label: "Ir a mi Dashboard", icon: LayoutDashboard }
    : whitelist.hasApplication
      ? { href: whitelist.nextRoute, label: "Continuar mi Whitelist", icon: ClipboardCheck }
      : { href: "/whitelist", label: "Empezar Whitelist", icon: ClipboardCheck };

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const response = await fetch("/api/server-status");

        if (response.ok) {
          const data = await response.json();
          setServerStatus({
            online: data.online || 0,
            max: data.max || 40,
          });
          setServerPlayers({ "los-santos": data.online || 0 });
        }
      } catch (error) {
        console.error("Error fetching server status:", error);
        setServerStatus({ online: 0, max: 50 });
        setServerPlayers({ "los-santos": 0 });
      }
    };

    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalMaxPlayers = servers.reduce((sum, s) => sum + s.maxPlayers, 0);

  const dynamicStats = [
    { icon: DiscordIcon, value: <CountUpStat target={13894} />, label: "MIEMBROS DISCORD" },
    { icon: Users, value: <><CountUpStat target={serverStatus.online} />/{serverStatus.max}</>, label: "EN LÍNEA" },
    { icon: Star, value: <CountUpStat target={reviewStats.comunidad.avgRating} decimals={1} />, label: "RATING" },
    { icon: MessageSquare, value: <CountUpStat target={reviewStats.comunidad.count} />, label: "RESEÑAS" },
  ];

  const featuredMembership = memberships.find((m) => m.id === "mem-elite") || memberships[0];
  const featuredKit = kits.find((k) => k.id === "kit-full") || kits[0];
  const featuredCoins = hubCoinsPackages.find((p) => p.popular) || hubCoinsPackages[0];

  const overallReviewCount = allReviewStats.comunidad.count + allReviewStats.tienda.count + allReviewStats.hubCoins.count;
  const overallReviewAvg = overallReviewCount > 0
    ? (
        (allReviewStats.comunidad.avgRating * allReviewStats.comunidad.count +
          allReviewStats.tienda.avgRating * allReviewStats.tienda.count +
          allReviewStats.hubCoins.avgRating * allReviewStats.hubCoins.count) /
        overallReviewCount
      )
    : 0;
  const featuredReviews = allReviews.filter((r) => r.rating >= 4).slice(0, 6);

  return (
    <main className="min-h-screen bg-[var(--background-alt)]">
      <Navbar />

      <section className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />

        <div className="relative z-10 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-2">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-none">
                    <span className="text-[var(--foreground)] block">ERLC</span>
                    <span className="text-gradient-blue glow-blue block">HUB</span>
                  </h1>
                </div>

                <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-md">
                  Somos una comunidad dedicada a ofrecer la mejor experiencia de roleplay en Roblox, con servidores de alta calidad, eventos exclusivos y una comunidad apasionada. Únete a nosotros y vive el roleplay en ERLC nunca antes visto.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                  {!isLoading && (
                    <a
                      href={primaryAction.href}
                      className="group flex items-center justify-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      <primaryAction.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      {primaryAction.label}
                      <span className="flex items-center">
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 animate-chevron" />
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 -ml-2 animate-chevron" style={{ animationDelay: "0.1s" }} />
                      </span>
                    </a>
                  )}
                  <a
                    href="https://discord.com/invite/xKJqNX7uC3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 bg-transparent border border-[#2a2a3a] hover:border-[#3a3a4a] text-[var(--foreground)] px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    <DiscordIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    UNIRSE A DISCORD
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {features.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-1.5 sm:gap-2 border border-[var(--card-border-soft)] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-[var(--text-muted)] backdrop-blur-sm" style={{ background: "color-mix(in srgb, var(--card-bg) 50%, transparent)" }}>
                      <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 pt-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--card-border-soft) 50%, transparent)" }}>
                  {dynamicStats.map((stat: any, index: number) => (
                    <div key={stat.label} className="flex items-center gap-2 sm:gap-3">
                      {index > 1 && <div className="h-6 w-px bg-[var(--card-bg-2)] hidden sm:block" />}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#8e00f7]" />
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stat.value}</div>
                          <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider">{stat.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 hidden lg:block">
                  <div className="flex flex-col items-center text-[var(--text-faint)] text-sm gap-2">
                    <span className="uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="h-4 w-4 animate-bounce" />
                  </div>
                </div>
              </div>

              <div className="lg:pt-8">
                <div className="relative backdrop-blur-sm border border-[var(--card-border-soft)] rounded-2xl p-6 sm:p-8 overflow-hidden" style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}>
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(142,0,247,0.15), transparent 60%)' }} />

                  <div className="relative flex items-center gap-2 mb-6">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
                      <CountUpStat target={serverStatus.online} /> jugadores en línea ahora
                    </span>
                  </div>

                  <div className="relative flex items-center gap-4 mb-6 pb-6 border-b border-[var(--card-border-soft)]">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(communityRating)) ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[#2a2a3a]"}`} />
                      ))}
                    </div>
                    <div>
                      <div className="text-[var(--foreground)] font-bold leading-none"><CountUpStat target={reviewStats.comunidad.avgRating} decimals={1} />/5</div>
                      <div className="text-xs text-[var(--text-faint)]"><CountUpStat target={reviewStats.comunidad.count} /> reseñas de la comunidad</div>
                    </div>
                  </div>

                  {featuredReviews[0] ? (
                    <div className="relative">
                      <Quote className="h-6 w-6 text-[#8e00f7]/40 mb-2" />
                      <p className="text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-4">"{featuredReviews[0].comment}"</p>
                      <div className="flex items-center gap-3">
                        {featuredReviews[0].avatar && featuredReviews[0].userId ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${featuredReviews[0].userId}/${featuredReviews[0].avatar}.png?size=48`}
                            alt={featuredReviews[0].username || featuredReviews[0].name}
                            className="w-9 h-9 rounded-full border border-[#8e00f7]/40"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#8e00f7]/20 flex items-center justify-center text-[#8e00f7] font-bold text-sm">
                            {featuredReviews[0].name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-sm text-[var(--foreground)] font-medium">{featuredReviews[0].username || featuredReviews[0].name}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="relative text-[var(--text-faint)] text-sm">Sé el primero en dejar una reseña de tu experiencia.</p>
                  )}

                  <a href="#resenas" className="relative mt-6 flex items-center justify-center gap-2 text-sm font-bold text-[#8e00f7] hover:text-[#a64dfa] transition-colors">
                    Ver todas las reseñas
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background-alt)] to-transparent z-10" />
      </section>

      <section className="relative py-24 bg-[var(--background-alt)] overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(142,0,247,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(142,0,247,0.1) 1px, transparent 1px),
              linear-gradient(rgba(142,0,247,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(142,0,247,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          }} />
          <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8e00f7]/40 to-transparent" />
          <div className="absolute top-[60%] left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#8e00f7]/50 to-transparent" />
          <div className="absolute top-0 bottom-0 left-[25%] w-[2px] bg-gradient-to-b from-transparent via-[#8e00f7]/40 to-transparent" />
          <div className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-gradient-to-b from-transparent via-[#8e00f7]/40 to-transparent" />
          <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-[#8e00f7] rounded-full animate-pulse shadow-lg shadow-[#8e00f7]/50" />
          <div className="absolute top-[45%] left-[55%] w-2 h-2 bg-[#22c55e] rounded-full animate-pulse shadow-lg shadow-[#22c55e]/50" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-[65%] left-[35%] w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse shadow-lg shadow-[#f59e0b]/50" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[30%] left-[80%] w-2 h-2 bg-[#ec4899] rounded-full animate-pulse shadow-lg shadow-[#ec4899]/50" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] mb-4">
                ¿Cómo puedo <span className="text-[#8e00f7]">jugar</span>?
              </h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
                Sigue estos simples pasos para unirte a la mejor comunidad de roleplay en ERLC
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {playSteps.map((step, index) => (
              <AnimatedSection key={step.number} delay={index * 150}>
                <div className="group relative backdrop-blur-sm border border-[var(--card-border)] rounded-2xl p-8 hover:border-[#8e00f7]/50 transition-all duration-500 hover:-translate-y-2" style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}>
                  <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ backgroundColor: step.color, boxShadow: `0 4px 20px ${step.color}40` }}>
                    {step.number}
                  </div>
                  <div className="mt-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                      <step.icon className="w-8 h-8" style={{ color: step.color }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-faint)] uppercase tracking-wider">{step.subtitle}</p>
                    <h3 className="text-xl font-bold text-[var(--foreground)]">{step.title}</h3>
                    <p className="text-[var(--text-muted)] leading-relaxed">{step.description}</p>
                  </div>
                  {index < playSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-[#1e1e2e] to-transparent" />
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
              {!isLoading && (
                <a href={primaryAction.href} className="inline-flex items-center gap-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-[#8e00f7]/25">
                  <primaryAction.icon className="w-5 h-5" />
                  {primaryAction.label}
                  <ChevronRight className="w-5 h-5" />
                </a>
              )}
              <a href="https://discord.gg/xKJqNX7uC3" className="inline-flex items-center gap-3 bg-transparent border border-[#2a2a3a] hover:border-[#3a3a4a] text-[var(--foreground)] px-8 py-4 rounded-xl font-bold transition-all duration-300">
                <DiscordIcon className="w-5 h-5" />
                Unirse al Discord
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative py-24 bg-[var(--background-alt)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '200px 200px',
          }} />

          <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          <div className="absolute top-[50%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8e00f7]/40 to-transparent" />
          <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-gradient-to-b from-transparent via-white/15 to-transparent animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-0 bottom-0 left-[40%] w-[2px] bg-gradient-to-b from-transparent via-[#8e00f7]/30 to-transparent" />
          <div className="absolute top-0 bottom-0 left-[60%] w-[1px] bg-gradient-to-b from-transparent via-white/15 to-transparent animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-0 bottom-0 left-[80%] w-[2px] bg-gradient-to-b from-transparent via-[#8e00f7]/30 to-transparent" />

          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute top-0 left-[10%] w-[1px] h-[200%] bg-gradient-to-b from-transparent via-white/30 to-transparent transform -rotate-45 origin-top" />
            <div className="absolute top-0 right-[10%] w-[1px] h-[200%] bg-gradient-to-b from-transparent via-white/30 to-transparent transform rotate-45 origin-top" />
          </div>

          <div className="absolute top-[20%] left-[15%]">
            <div className="w-4 h-4 bg-[#8e00f7] rounded-full animate-pulse shadow-lg shadow-[#8e00f7]/60" />
            <div className="absolute inset-0 w-4 h-4 bg-[#8e00f7] rounded-full animate-ping opacity-30" />
          </div>
          <div className="absolute top-[35%] left-[70%]">
            <div className="w-3 h-3 bg-[#3b82f6] rounded-full animate-pulse shadow-lg shadow-[#3b82f6]/60" style={{ animationDelay: "0.3s" }} />
            <div className="absolute inset-0 w-3 h-3 bg-[#3b82f6] rounded-full animate-ping opacity-30" style={{ animationDelay: "0.3s" }} />
          </div>
          <div className="absolute top-[60%] left-[25%]">
            <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse shadow-lg shadow-[#22c55e]/60" style={{ animationDelay: "0.6s" }} />
            <div className="absolute inset-0 w-3 h-3 bg-[#22c55e] rounded-full animate-ping opacity-30" style={{ animationDelay: "0.6s" }} />
          </div>
          <div className="absolute top-[45%] left-[85%]">
            <div className="w-3 h-3 bg-[#ef4444] rounded-full animate-pulse shadow-lg shadow-[#ef4444]/60" style={{ animationDelay: "0.9s" }} />
            <div className="absolute inset-0 w-3 h-3 bg-[#ef4444] rounded-full animate-ping opacity-30" style={{ animationDelay: "0.9s" }} />
          </div>
          <div className="absolute top-[70%] left-[55%]">
            <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: "1.2s" }} />
          </div>
          <div className="absolute top-[30%] left-[45%]">
            <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
          </div>

          
          <div className="absolute top-[50%] left-0 w-2 h-1 bg-yellow-400/60 rounded-full animate-[moveRight_8s_linear_infinite] shadow-lg shadow-yellow-400/40" />
          <div className="absolute top-[25%] right-0 w-2 h-1 bg-red-400/60 rounded-full animate-[moveLeft_10s_linear_infinite] shadow-lg shadow-red-400/40" style={{ animationDelay: "2s" }} />
          <div className="absolute top-0 left-[40%] w-1 h-2 bg-white/60 rounded-full animate-[moveDown_12s_linear_infinite] shadow-lg shadow-white/40" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="text-[var(--foreground)]">Nuestras </span>
                <span className="text-[var(--text-faint)]">comunidades</span>
              </h2>
              <p className="text-[var(--text-faint)] text-lg max-w-2xl mx-auto">
                ¡Jugadores de todo el mundo están esperándote para jugar!
                <br />
                Selecciona un servidor y empieza a jugar.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="flex justify-center items-center gap-12 mb-16">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse shadow-lg shadow-[#22c55e]/50" />
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-[var(--foreground)]"><CountUpStat target={serverStatus.online} /></span>
                  <div className="text-[var(--text-faint)] text-sm uppercase tracking-wider">
                    <div>ONLINE</div>
                    <div>AHORA</div>
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[var(--foreground)]"><CountUpStat target={totalMaxPlayers} /></span>
                <div className="text-[var(--text-faint)] text-sm uppercase tracking-wider">
                  <div>MÁXIMO</div>
                  <div>JUGADORES</div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {servers.map((server, index) => (
              <AnimatedSection key={server.id} delay={300 + index * 100}>
                <div
                  className={`group relative backdrop-blur-sm border rounded-xl p-6 transition-all duration-500 ${
                    server.comingSoon ? "opacity-80" : "cursor-pointer hover:-translate-y-2"
                  } ${
                    selectedServer === server.id ? "border-[#8e00f7] shadow-lg shadow-[#8e00f7]/20" : "border-[var(--card-border)] hover:border-[#3e3e4e]"
                  }`}
                  style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}
                  onClick={() => !server.comingSoon && setSelectedServer(selectedServer === server.id ? null : server.id)}
                >
                  {server.comingSoon && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        PRÓXIMAMENTE
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/10 p-2">
                      <img src={`/server/${server.id}.png`} alt={server.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center gap-2">
                      {server.comingSoon ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-xs text-yellow-500">PRONTO</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                          <span className="text-xs text-[var(--text-faint)]">ONLINE</span>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{server.name}</h3>
                  <p className="text-sm text-[var(--text-faint)] mb-4">{server.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-faint)]">Jugadores</span>
                      <span className="text-[var(--foreground)] font-medium">
                        {server.comingSoon ? "0" : <CountUpStat target={serverPlayers[server.id] || 0} />}/{server.maxPlayers}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--card-bg-2)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: server.comingSoon ? "0%" : `${((serverPlayers[server.id] || 0) / server.maxPlayers) * 100}%`,
                        backgroundColor: server.color,
                      }} />
                    </div>
                  </div>

                  <div className="mt-4">
                    {server.comingSoon ? (
                      <div className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] bg-[var(--card-bg-2)] border border-[var(--card-border-soft)]">
                        <Globe className="w-4 h-4" />
                        Próximamente
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <a href="https://discord.com/invite/xKJqNX7uC3" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: server.color }}>
                          <Globe className="w-4 h-4" />
                          Unirse
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-[var(--background)] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#8e00f7]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-[var(--text-faint)] font-medium uppercase tracking-wider mb-2">Tienda ERLC HUB</p>
                <h2 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] mb-4">
                  Potencia tu <span className="text-[#8e00f7]">experiencia</span>
                </h2>
                <p className="text-[var(--text-muted)] text-lg max-w-xl">
                  Membresías, kits y Hub Coins para llevar tu roleplay al siguiente nivel.
                  {tiendaStats.totalOrders > 0 && (
                    <span className="text-[var(--text-faint)]"> Ya se completaron {formatNumber(tiendaStats.totalOrders)} pedidos.</span>
                  )}
                </p>
              </div>
              <a href="/tienda" className="group flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#8e00f7]/50 text-[var(--foreground)] px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap w-fit">
                Ver Tienda Completa
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedSection delay={0}>
              <ProductCard
                href={`/tienda/membresia/${featuredMembership.id}`}
                image={featuredMembership.image}
                name={`Membresía ${featuredMembership.name}`}
                description={featuredMembership.description}
                color={featuredMembership.color}
                badge={
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[#12121c]/80 backdrop-blur-sm text-white px-2 py-1 rounded-full border border-white/10">
                    <Crown className="w-3 h-3" style={{ color: featuredMembership.color }} /> Membresía
                  </span>
                }
                priceLabel={<span>{convertPrice(featuredMembership.pricePermanent, currencies[0])} único pago</span>}
              />
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <ProductCard
                href={`/tienda/kit/${featuredKit.id}`}
                image={featuredKit.image}
                name={featuredKit.name}
                description={featuredKit.description}
                color={featuredKit.color}
                badge={
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[#12121c]/80 backdrop-blur-sm text-white px-2 py-1 rounded-full border border-white/10">
                    <Package className="w-3 h-3" style={{ color: featuredKit.color }} /> Kit
                  </span>
                }
                priceLabel={
                  <span className="inline-flex items-center gap-1.5">
                    {featuredKit.priceHubCoins}
                    <Image src="/hub-coins.png" alt="Hub Coins" width={16} height={16} className="w-4 h-4" />
                  </span>
                }
              />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <ProductCard
                href="/tienda/hub-coins"
                image="/hub-coins.png"
                name={`${formatNumber(featuredCoins.coins + featuredCoins.bonus)} Hub Coins`}
                description={`Recarga ${formatNumber(featuredCoins.coins)} Hub Coins${featuredCoins.bonus > 0 ? ` + ${formatNumber(featuredCoins.bonus)} de bono` : ""} para gastar en kits, whitelist fast y más.`}
                color="#f59e0b"
                badge={
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[#12121c]/80 backdrop-blur-sm text-white px-2 py-1 rounded-full border border-white/10">
                    <Coins className="w-3 h-3 text-[#f59e0b]" /> Hub Coins
                  </span>
                }
                priceLabel={<span>${featuredCoins.priceUSD} USD</span>}
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section id="resenas" className="relative py-24 bg-[var(--background-alt)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-[var(--text-faint)] font-medium uppercase tracking-wider mb-2">Reseñas</p>
              <h2 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] mb-4">
                Lo que dice <span className="text-[#8e00f7]">nuestra comunidad</span>
              </h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(overallReviewAvg) ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[#2a2a3a]"}`} />
                  ))}
                </div>
                <span className="text-[var(--foreground)] font-bold"><CountUpStat target={overallReviewAvg} decimals={1} />/5</span>
              </div>
              <p className="text-[var(--text-muted)]"><CountUpStat target={overallReviewCount} /> reseñas de la comunidad y de la tienda</p>
            </div>
          </AnimatedSection>

          {!reviewsLoading && featuredReviews.length === 0 ? (
            <div className="text-center text-[var(--text-faint)] py-12">Aún no hay reseñas. Sé el primero en compartir tu experiencia.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredReviews.map((review, index) => (
                <AnimatedSection key={review._id} delay={index * 100}>
                  <div className="h-full bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[#2a2a3a]"}`} />
                      ))}
                    </div>
                    <p className="text-[var(--text-muted)] leading-relaxed mb-6 flex-1 line-clamp-4">"{review.comment}"</p>
                    <div className="flex items-center gap-3">
                      {review.avatar && review.userId ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${review.userId}/${review.avatar}.png?size=48`}
                          alt={review.username || review.name}
                          className="w-9 h-9 rounded-full border border-[#8e00f7]/40"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#8e00f7]/20 flex items-center justify-center text-[#8e00f7] font-bold text-sm">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-[var(--foreground)] font-medium">{review.username || review.name}</div>
                        <div className="text-xs text-[var(--text-faint)]">{review.tag}</div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}

          <AnimatedSection delay={300}>
            <div className="text-center mt-12">
              <a href="/resenas" className="inline-flex items-center gap-2 text-[#8e00f7] hover:text-[#a64dfa] font-bold transition-colors">
                Ver todas las reseñas
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative py-24 bg-[var(--background-alt)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8e00f7]/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="relative">
                <div className="space-y-4">
                  <div className="relative h-64 rounded-2xl overflow-hidden group">
                    <img src="/sistemas/comunidad.png" alt="Comunidad" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <p className="text-white font-medium">Nuestra Comunidad</p>
                      <p className="text-sm text-[var(--text-muted)]"><CountUpStat target={serverStatus.online} /> jugadores conectados ahora</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative h-40 rounded-xl overflow-hidden group">
                      <img src="/sistemas/eventos.png" alt="Eventos" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDuration: '3s' }} />
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-sm font-medium">Eventos</p>
                      </div>
                    </div>
                    <div className="relative h-40 rounded-xl overflow-hidden group">
                      <img src="/sistemas/seguridad.png" alt="Seguridad" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDuration: '3s' }} />
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-sm font-medium">Seguridad</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-[#8e00f7]" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[var(--foreground)]"><CountUpStat target={reviewStats.comunidad.avgRating} decimals={1} /></div>
                      <div className="text-xs text-[var(--text-faint)]"><CountUpStat target={reviewStats.comunidad.count} /> reseñas</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="space-y-8">
                <div>
                  <p className="text-[var(--text-faint)] font-medium uppercase tracking-wider mb-2">Sobre Nosotros</p>
                  <h2 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] mb-6">
                    La comunidad de roleplay <span className="text-[#8e00f7]">más grande</span> de ERLC
                  </h2>
                  <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                    ERLC HUB nació con la visión de crear la experiencia de roleplay definitiva en Emergency Response: Liberty County.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#8e00f7]" />
                    </div>
                    <div>
                      <h4 className="text-[var(--foreground)] font-bold mb-1">Comunidad Verificada</h4>
                      <p className="text-[var(--text-muted)] text-sm">Todos nuestros miembros pasan por un proceso de whitelist.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-5 h-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h4 className="text-[var(--foreground)] font-bold mb-1">Soporte 24/7</h4>
                      <p className="text-[var(--text-muted)] text-sm">Nuestro equipo de staff está disponible las 24 horas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                    <div>
                      <h4 className="text-[var(--foreground)] font-bold mb-1">Eventos Exclusivos</h4>
                      <p className="text-[var(--text-muted)] text-sm">Participa en eventos semanales con premios.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--card-border)]">
                  <div><div className="text-3xl font-black text-[var(--foreground)]"><CountUpStat target={serverStatus.online} /></div><div className="text-sm text-[var(--text-faint)]">En línea ahora</div></div>
                  <div><div className="text-3xl font-black text-[var(--foreground)]"><CountUpStat target={reviewStats.comunidad.avgRating} decimals={1} />/5</div><div className="text-sm text-[var(--text-faint)]">Calificación</div></div>
                  <div><div className="text-3xl font-black text-[var(--foreground)]">24/7</div><div className="text-sm text-[var(--text-faint)]">Soporte</div></div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-[var(--background-alt)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-[var(--text-faint)] font-medium uppercase tracking-wider mb-2">El Equipo</p>
              <h2 className="text-4xl sm:text-5xl font-black text-[var(--foreground)] mb-4">
                Nuestro <span className="text-[#8e00f7]">Equipo Fundador</span>
              </h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
                Conoce a las personas que hacen posible esta increíble comunidad
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <AnimatedSection key={member.name} delay={index * 100}>
                <div className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 hover:border-[#8e00f7]/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-24 opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `linear-gradient(180deg, ${member.color} 0%, transparent 100%)` }} />
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto relative" style={{ backgroundColor: member.color }}>
                      <Image
                        src={member.avatar}
                        alt={`${member.name} - ${member.role}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'absolute inset-0 flex items-center justify-center text-2xl font-black text-white';
                            fallback.textContent = member.avatarFallback;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                        {member.avatarFallback}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-1/2 translate-x-10 w-5 h-5 bg-[#22c55e] rounded-full border-4 border-[var(--card-bg)]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{member.name}</h3>
                    <p className="text-sm font-medium" style={{ color: member.color }}>{member.role}</p>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed">{member.description}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    {member.socials.discord && (
                      <a href={member.socials.discord} className="w-9 h-9 rounded-lg bg-[var(--card-bg-2)] hover:bg-[#5865F2] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors">
                        <DiscordIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.instagram && (
                      <a href={member.socials.instagram} className="w-9 h-9 rounded-lg bg-[var(--card-bg-2)] hover:bg-[#E4405F] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.youtube && member.socials.youtube !== "" && (
                      <a href={member.socials.youtube} className="w-9 h-9 rounded-lg bg-[var(--card-bg-2)] hover:bg-[#FF0000] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors">
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="relative py-16 bg-[var(--background-alt)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-[#8e00f7] to-[#6b21a8] rounded-3xl p-8 sm:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl" />

              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <DiscordIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">¿Listo para empezar?</h3>
                    <p className="text-white/80">Únete a nuestra comunidad para compartir y hacer preguntas.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {!isLoading && (
                    <a href={primaryAction.href} className="flex items-center justify-center gap-2 bg-white text-[#8e00f7] px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 whitespace-nowrap w-full sm:w-auto">
                      <primaryAction.icon className="w-5 h-5" />
                      {primaryAction.label}
                    </a>
                  )}
                  <a href="https://discord.gg/xKJqNX7uC3" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 whitespace-nowrap w-full sm:w-auto">
                    Ir a Discord
                    <ChevronRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </main>
  );
}