"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FileText, ChevronRight, Shield, AlertTriangle, CreditCard, Ban, Scale, Mail, Gamepad2 } from "lucide-react";

const sections = [
  {
    id: "aceptacion",
    icon: FileText,
    title: "1. Aceptación de los Términos",
    content: `Al acceder y utilizar los servicios de ERLCᴴᵁᴮ, usted acepta estar legalmente vinculado por estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no utilice nuestros servicios.

Estos términos se aplican a todos los usuarios, visitantes y cualquier persona que acceda o utilice el servicio.`
  },
  {
    id: "servicios",
    icon: Shield,
    title: "2. Descripción de los Servicios",
    content: `ERLCᴴᵁᴮ proporciona una plataforma para la compra de Hub Coins, membresías, kits y otros artículos virtuales para uso en servidores de roleplay.

Nuestros servicios incluyen:
• Venta de Hub Coins (moneda virtual)
• Membresías con beneficios exclusivos (VIP, ELITE, LEGEND)
• Kits de inicio y especializados
• Artículos individuales (vehículos, armas, ropa)
• Juegos de casino con Hub Coins

Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto del servicio en cualquier momento.`
  },
  {
    id: "roblox-oauth",
    icon: Gamepad2,
    title: "3. Vinculación de cuenta de Roblox",
    content: `ERLCᴴᵁᴮ ofrece la opción de vincular su cuenta de Roblox usando el sistema oficial de inicio de sesión de Roblox (OAuth 2.0), únicamente con los permisos "openid" y "profile".

Al vincular su cuenta, usted autoriza a ERLCᴴᵁᴮ a leer su nombre de usuario, nombre para mostrar, foto de perfil e ID de usuario de Roblox, exclusivamente para identificarlo dentro del roleplay del servidor (DNI digital, panel de jugador y verificación por parte del staff).

Esta vinculación:
• NO otorga acceso a su contraseña de Roblox — la autenticación ocurre en los servidores de Roblox
• NO otorga acceso a sus Robux, compras, inventario, grupos ni amigos
• Es completamente opcional y puede revocarse en cualquier momento, tanto desde su panel de usuario como desde la configuración de su cuenta de Roblox

ERLCᴴᵁᴮ es un servicio independiente y no está afiliado, asociado ni respaldado por Roblox Corporation.`
  },
  {
    id: "pagos",
    icon: CreditCard,
    title: "4. Pagos y Reembolsos",
    content: `Todos los pagos se procesan de forma segura a través de proveedores de pago certificados (Visa, Mastercard. Bancolombia, Nequi, Visa Rewarble, Criptomonedas).

Política de reembolsos:
• Los Hub Coins entregados NO son reembolsables
• Las membresías activadas NO son reembolsables
• Los kits y artículos entregados NO son reembolsables
• En caso de error técnico de nuestra parte, evaluaremos cada caso individualmente

Los precios están sujetos a cambios sin previo aviso. Los precios vigentes al momento de la compra serán los aplicables.`
  },
  {
    id: "prohibiciones",
    icon: Ban,
    title: "5. Conducta Prohibida",
    content: `Al utilizar nuestros servicios, usted se compromete a NO:

• Utilizar los servicios para actividades ilegales
• Intentar hackear, modificar o explotar vulnerabilidades del sistema
• Crear múltiples cuentas para obtener beneficios indebidos
• Revender Hub Coins o artículos a terceros
• Compartir credenciales de acceso con otras personas
• Realizar contracargos fraudulentos
• Acosar, amenazar o abusar de otros usuarios o del personal de soporte

El incumplimiento resultará en la suspensión o terminación inmediata de su cuenta sin reembolso.`
  },
  {
    id: "responsabilidad",
    icon: AlertTriangle,
    title: "6. Limitación de Responsabilidad",
    content: `ERLCᴴᵁᴮ es un servicio independiente y NO está afiliado, asociado ni respaldado por Roblox Corporation ni Police Community Roleplay.

En la máxima medida permitida por la ley:
• No garantizamos disponibilidad ininterrumpida del servicio
• No somos responsables por pérdidas indirectas o consecuentes
• No somos responsables por acciones de Roblox Corporation que afecten su cuenta
• Nuestra responsabilidad total está limitada al monto pagado por el servicio específico

Los artículos virtuales no tienen valor monetario fuera de la plataforma y están sujetos a los términos de Roblox.`
  },
  {
    id: "disputas",
    icon: Scale,
    title: "7. Resolución de Disputas",
    content: `Cualquier disputa relacionada con estos términos se resolverá de la siguiente manera:

1. Primero, contacte a nuestro equipo de soporte para intentar resolver el problema
2. Si no se llega a una resolución, las partes acuerdan someterse a mediación
3. Las disputas no resueltas se someterán a arbitraje vinculante

Estos términos se rigen por las leyes aplicables en la jurisdicción donde opera ERLCᴴᵁᴮ.`
  },
  {
    id: "modificaciones",
    icon: FileText,
    title: "8. Modificaciones a los Términos",
    content: `Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.

Su uso continuado del servicio después de cualquier modificación constituye su aceptación de los nuevos términos.

Recomendamos revisar esta página periódicamente para mantenerse informado de cualquier cambio.`
  },
  {
    id: "contacto",
    icon: Mail,
    title: "9. Contacto",
    content: `Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos:

• Email: erlchubstudios2025@gmail.com
• Discord: https://discord.com/invite/xKJqNX7uC3

Nuestro equipo de soporte está disponible 24/7 para asistirle.`
  }
];

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[var(--background-alt)]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Términos de Servicio</span>
          </div>

          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-[#8e00f7]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Términos de Servicio</h1>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              Por favor, lea cuidadosamente estos términos antes de utilizar nuestros servicios.
            </p>
            <p className="text-[var(--text-faint)] text-sm mt-4">
              Última actualización: 5 de agosto de 2026
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Contenido</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[#8e00f7] text-sm transition-colors py-1"
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-2xl p-6 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-[#8e00f7]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="text-[var(--text-muted)] whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-[#8e00f7]/20 to-[#a64dfa]/20 border border-[#8e00f7]/30 rounded-2xl p-6 text-center">
            <p className="text-[var(--text-muted)] mb-4">
              ¿Tienes preguntas sobre nuestros términos?
            </p>
            <Link
              href="https://mail.google.com/mail/?view=cm&to=erlchubstudios2025@gmail.com"
              className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 py-3 rounded-xl font-bold transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="h-5 w-5" />
              Contactar Soporte
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}