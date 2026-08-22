"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";
import {
  ChevronRight, Truck, Shield, Headphones, Eye, Star, MessageSquare,
  Gamepad2, UserCheck, FileCheck, Users, Car, Building2, Briefcase, Siren,
  Instagram, Youtube, ChevronDown, MapPin, Globe
} from "lucide-react";
import { useHomeReviews } from "@/hooks/useHomeReviews";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useRouter } from "next/navigation";
import DiscordLogin from "@/components/DiscordLogin";

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

interface RoleplaySystem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  image: string;
  color: string;
  title: string;
  description: string;
}

const roleplaySystems: RoleplaySystem[] = [
  {
    id: "vehicles",
    name: "Vehículos",
    icon: Car,
    image: "/sistemas/conseccionario.png",
    color: "#8e00f7",
    title: "SISTEMA DE VEHÍCULOS",
    description: "Experimenta la conducción más realista con nuestro sistema de vehículos avanzado. Desde patrullas policiales hasta vehículos civiles de alta gama, cada unidad cuenta con física realista, daños visuales y personalización completa.",
  },
  {
    id: "properties",
    name: "Propiedades",
    icon: Building2,
    image: "/sistemas/propiedades.png",
    color: "#3b82f6",
    title: "SISTEMA DE PROPIEDADES",
    description: "Adquiere y personaliza tu propio espacio en la ciudad. Desde apartamentos urbanos hasta mansiones de lujo, cada propiedad es completamente personalizable.",
  },
  {
    id: "jobs",
    name: "Empleos",
    icon: Briefcase,
    image: "/sistemas/empleos.png",
    color: "#22c55e",
    title: "SISTEMA DE EMPLEOS",
    description: "Más de 25 profesiones diferentes te esperan. Desde policía, bombero y paramédico hasta mecánico, taxista o empresario.",
  },
  {
    id: "emergency",
    name: "Emergencias",
    icon: Siren,
    image: "/sistemas/emergencia.png",
    color: "#ef4444",
    title: "SISTEMA DE EMERGENCIAS",
    description: "Vive la adrenalina de los servicios de emergencia. Sistema de despacho en tiempo real, radio policial, códigos 10 y procedimientos realistas.",
  },
];

const servers = [
  { id: "los-santos", name: "Los Santos", description: "La ciudad principal con todo tipo de actividades", maxPlayers: 40, color: "#8e00f7", comingSoon: false },
  { id: "liberty-city", name: "Liberty City", description: "Ambiente urbano con rascacielos y negocios", maxPlayers: 40, color: "#3b82f6", comingSoon: true },
  { id: "vice-city", name: "Vice City", description: "Estilo retro con playas y vida nocturna", maxPlayers: 40, color: "#22c55e", comingSoon: true },
  { id: "las-venturas", name: "Las Venturas", description: "La ciudad del entretenimiento y los casinos", maxPlayers: 40, color: "#ef4444", comingSoon: true },
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

  const [activeSystem, setActiveSystem] = useState("vehicles");
  const { stats: reviewStats } = useHomeReviews(); 
  
  const communityRating = reviewStats.comunidad.avgRating > 0 ? reviewStats.comunidad.avgRating.toFixed(1) : "0";
  const communityReviews = reviewStats.comunidad.count > 0 ? `${reviewStats.comunidad.count}` : "0";
  const [serverStatus, setServerStatus] = useState({ online: 0, max: 40 });
  const [totalOnline, setTotalOnline] = useState(0);
  const [serverPlayers, setServerPlayers] = useState<Record<string, number>>({});
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentSystem = roleplaySystems.find(s => s.id === activeSystem) || roleplaySystems[0];
  const handleSystemChange = (systemId: string) => {
    if (systemId === activeSystem || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSystem(systemId);
      setIsTransitioning(false);
    }, 150);
  };

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
          const baseOnline = data.online || 0;
          setServerPlayers({
            "los-santos": baseOnline,
            "liberty-city": Math.floor(Math.random() * 25 + 5),
            "vice-city": Math.floor(Math.random() * 20 + 3),
            "las-venturas": Math.floor(Math.random() * 18 + 2),
          });
          setTotalOnline(baseOnline + Math.floor(Math.random() * 50 + 20));
        }
      } catch (error) {
        console.error("Error fetching server status:", error);
        setServerStatus({ online: 0, max: 40 });
        setServerPlayers({
          "los-santos": 0,
          "liberty-city": 0,
          "vice-city": 0,
          "las-venturas": 0,
        });
      }
    };

    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const dynamicStats = [
    { icon: Users, value: "+11K", label: "MIEMBROS" },
    { icon: Eye, value: `${serverStatus.online}/${serverStatus.max}`, label: "EN LÍNEA" },
    { icon: Star, value: communityRating, label: "RATING" },
    { icon: MessageSquare, value: communityReviews, label: "RESEÑAS" },
  ];

  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <section className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />

        <div className="relative z-10 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-2">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-none">
                    <span className="text-white block">ERLC</span>
                    <span className="text-gradient-blue glow-blue block">HUB</span>
                  </h1>
                </div>

                <p className="text-gray-400 text-base sm:text-lg max-w-md">
                  Somos una comunidad dedicada a ofrecer la mejor experiencia de roleplay en Roblox, con servidores de alta calidad, eventos exclusivos y una comunidad apasionada. Únete a nosotros y vive el roleplay en ERLC nunca antes visto.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                  <a 
                    href="https://discord.com/invite/xKJqNX7uC3" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    UNIRSE AHORA
                    <span className="flex items-center">
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 animate-chevron" />
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 -ml-2 animate-chevron" style={{ animationDelay: "0.1s" }} />
                    </span>
                  </a>
                  <a href="/resenas" className="flex items-center justify-center gap-2 bg-transparent border border-[#2a2a3a] hover:border-[#3a3a4a] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300">
                    TESTIMONIOS
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {features.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-1.5 sm:gap-2 bg-[#12121c]/50 border border-[#1a1a28] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-gray-400 backdrop-blur-sm">
                      <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 pt-4 border-t border-[#1a1a28]/50">
                  {dynamicStats.map((stat: any, index: number) => (
                    <div key={stat.label} className="flex items-center gap-2 sm:gap-3">
                      {index > 1 && <div className="h-6 w-px bg-[#1a1a28] hidden sm:block" />}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#8e00f7]" />
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 hidden lg:block">
                  <div className="flex flex-col items-center text-gray-500 text-sm gap-2">
                    <span className="uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="h-4 w-4 animate-bounce" />
                  </div>
                </div>
              </div>

              <div className="lg:pt-8">
                <TestimonialsCarousel />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0c14] to-transparent z-10" />
      </section>

      <section className="relative py-24 bg-[#0c0c14] overflow-hidden">
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
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                ¿Cómo puedo <span className="text-[#8e00f7]">jugar</span>?
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Sigue estos simples pasos para unirte a la mejor comunidad de roleplay en ERLC
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {playSteps.map((step, index) => (
              <AnimatedSection key={step.number} delay={index * 150}>
                <div className="group relative bg-[#12121c]/80 backdrop-blur-sm border border-[#1e1e2e] rounded-2xl p-8 hover:border-[#8e00f7]/50 transition-all duration-500 hover:-translate-y-2">
                  <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ backgroundColor: step.color, boxShadow: `0 4px 20px ${step.color}40` }}>
                    {step.number}
                  </div>
                  <div className="mt-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                      <step.icon className="w-8 h-8" style={{ color: step.color }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">{step.subtitle}</p>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                  {index < playSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-[#1e1e2e] to-transparent" />
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={500}>
            <div className="text-center mt-12">
              <a href="https://discord.gg/xKJqNX7uC3" className="inline-flex items-center gap-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-[#8e00f7]/25">
                <DiscordIcon className="w-5 h-5" />
                Unirse al Discord
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative py-24 bg-[#0a0a10] overflow-hidden">
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
                <span className="text-white">Nuestras </span>
                <span className="text-gray-500">comunidades</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
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
                  <span className="text-4xl sm:text-5xl font-black text-white">{serverStatus.online}</span>
                  <div className="text-gray-500 text-sm uppercase tracking-wider">
                    <div>ONLINE</div>
                    <div>AHORA</div>
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">{serverStatus.max}</span>
                <div className="text-gray-500 text-sm uppercase tracking-wider">
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
                  className={`group relative bg-[#12121c]/80 backdrop-blur-sm border rounded-xl p-6 transition-all duration-500 ${
                    server.comingSoon ? "opacity-80" : "cursor-pointer hover:-translate-y-2"
                  } ${
                    selectedServer === server.id ? "border-[#8e00f7] shadow-lg shadow-[#8e00f7]/20" : "border-[#1e1e2e] hover:border-[#3e3e4e]"
                  }`}
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
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 p-2">
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
                          <span className="text-xs text-gray-500">ONLINE</span>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{server.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{server.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Jugadores</span>
                      <span className="text-white font-medium">
                        {server.comingSoon ? "0" : (serverPlayers[server.id] || 0)}/{server.maxPlayers}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a28] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: server.comingSoon ? "0%" : `${((serverPlayers[server.id] || 0) / server.maxPlayers) * 100}%`,
                        backgroundColor: server.color,
                      }} />
                    </div>
                  </div>

                  <div className="mt-4">
                    {server.comingSoon ? (
                      <div className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-gray-400 bg-[#1a1a28] border border-[#2a2a3a]">
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

      <section className="relative py-24 bg-[#0a0a12]">
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
                      <p className="text-sm text-gray-300">+11,000 miembros activos</p>
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
                <div className="absolute -bottom-6 -right-6 bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-[#8e00f7]" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">4.9</div>
                      <div className="text-xs text-gray-500">Calificación</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="space-y-8">
                <div>
                  <p className="text-[#8e00f7] font-medium uppercase tracking-wider mb-2">Sobre Nosotros</p>
                  <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                    La comunidad de roleplay <span className="text-[#8e00f7]">más grande</span> de ERLC
                  </h2>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    ERLC HUB nació con la visión de crear la experiencia de roleplay definitiva en Emergency Response: Liberty County.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#8e00f7]/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#8e00f7]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Comunidad Verificada</h4>
                      <p className="text-gray-400 text-sm">Todos nuestros miembros pasan por un proceso de whitelist.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-5 h-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Soporte 24/7</h4>
                      <p className="text-gray-400 text-sm">Nuestro equipo de staff está disponible las 24 horas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Eventos Exclusivos</h4>
                      <p className="text-gray-400 text-sm">Participa en eventos semanales con premios.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1e1e2e]">
                  <div><div className="text-3xl font-black text-white">11K+</div><div className="text-sm text-gray-500">Miembros</div></div>
                  <div><div className="text-3xl font-black text-white">3+</div><div className="text-sm text-gray-500">Años activos</div></div>
                  <div><div className="text-3xl font-black text-white">24/7</div><div className="text-sm text-gray-500">Online</div></div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-[#0c0c14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-[#8e00f7] font-medium uppercase tracking-wider mb-2">El Equipo</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Nuestro <span className="text-[#8e00f7]">Equipo Fundador</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Conoce a las personas que hacen posible esta increíble comunidad
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <AnimatedSection key={member.name} delay={index * 100}>
                <div className="group relative bg-[#12121c] border border-[#1e1e2e] rounded-2xl p-6 hover:border-[#8e00f7]/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
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
                    <div className="absolute bottom-0 right-1/2 translate-x-10 w-5 h-5 bg-[#22c55e] rounded-full border-4 border-[#12121c]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-sm font-medium" style={{ color: member.color }}>{member.role}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    {member.socials.discord && (
                      <a href={member.socials.discord} className="w-9 h-9 rounded-lg bg-[#1a1a28] hover:bg-[#5865F2] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <DiscordIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.instagram && (
                      <a href={member.socials.instagram} className="w-9 h-9 rounded-lg bg-[#1a1a28] hover:bg-[#E4405F] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.youtube && member.socials.youtube !== "" && (
                      <a href={member.socials.youtube} className="w-9 h-9 rounded-lg bg-[#1a1a28] hover:bg-[#FF0000] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
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

      <section className="relative py-24 bg-[#0a0a12] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8e00f7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8e00f7]/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Experimenta el roleplay <span className="text-[#8e00f7]">como nunca antes...</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                Con más de <span className="text-[#8e00f7] font-bold">+3 años</span> en constante desarrollo, ERLC HUB cuenta con los
                <span className="text-[#8e00f7] font-bold"> sistemas más revolucionarios</span> en la historia del roleplay en Roblox.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {roleplaySystems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => handleSystemChange(system.id)}
                  disabled={isTransitioning}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeSystem === system.id
                      ? "bg-[#8e00f7] text-white shadow-lg shadow-[#8e00f7]/25"
                      : "bg-[#12121c] text-gray-400 hover:bg-[#1a1a28] hover:text-white border border-[#1e1e2e]"
                  } ${
                    isTransitioning ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300" style={{ 
                    backgroundColor: activeSystem === system.id ? '#8e00f7' : '#12121c'
                  }}>
                    <system.icon className={`w-5 h-5 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] ${activeSystem === system.id ? 'animate-pulse' : ''}`} style={{ animationDuration: '3s' }} />
                  </div>
                  {system.name}
                </button>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8e00f7]/20 rounded-lg">
                  <currentSystem.icon className="w-5 h-5 text-[#8e00f7]" />
                  <span className="text-[#8e00f7] font-medium text-sm">Sistema Destacado</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white">{currentSystem.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{currentSystem.description}</p>
                <span className="inline-flex items-center gap-2 text-[#8e00f7] font-medium">
                  PROXIMAMENTE
                  <ChevronRight className="w-5 h-5" />
                </span>
              </div>

              <div className="relative">
                <div className="space-y-4">
                  <div className="relative h-64 rounded-2xl overflow-hidden group">
                    <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                      <Image
                        src={currentSystem.image}
                        alt={currentSystem.name}
                        fill
                        className="object-cover rounded-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-60"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-[#8e00f7]/10 to-[#0c0c14]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <currentSystem.icon className="w-32 h-32 text-white/90 drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-pulse" style={{ animationDuration: '3s' }} />
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded text-white text-sm font-medium">Proximamente</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a28] to-[#0c0c14] border border-[#1e1e2e] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-black text-[#8e00f7]">200+</div>
                        <div className="text-xs text-gray-500">Características</div>
                      </div>
                    </div>
                    <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a28] to-[#0c0c14] border border-[#1e1e2e] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-black text-[#22c55e]">99%</div>
                        <div className="text-xs text-gray-500">Satisfacción</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-[#8e00f7] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#8e00f7]/20">
                  Exclusivo
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection>
        <section className="relative py-16 bg-[#0c0c14]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-[#8e00f7] to-[#6b21a8] rounded-3xl p-8 sm:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl" />

              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <DiscordIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">¡Te esperamos en Discord!</h3>
                    <p className="text-white/80">Únete a nuestra comunidad para compartir y hacer preguntas.</p>
                  </div>
                </div>

                <a href="https://discord.gg/xKJqNX7uC3" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-[#8e00f7] px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                  Ir a Discord
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </main>
  );
}