"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Shield, ChevronRight, Database, Eye, Lock, Share2, Clock, UserCheck, Settings, Mail, Gamepad2 } from "lucide-react";

const sections = [
  {
    id: "introduccion",
    icon: Shield,
    title: "1. Introducción",
    content: `En ERLCᴴᵁᴮ, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información personal.

Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política. Le recomendamos leerla detenidamente.`
  },
  {
    id: "recopilacion",
    icon: Database,
    title: "2. Información que Recopilamos",
    content: `Recopilamos la siguiente información:

Recopilamos la siguiente información:

Información proporcionada por usted:
• Nombre de usuario de Discord, Perfil y correo electronico de su cuenta de Discord
• Información de pago (procesada por terceros seguros)
• Nombre de usuario de Roblox
• Mensajes de soporte y comunicaciones

Información recopilada automáticamente:
• Dirección IP
• Tipo de navegador y dispositivo
• Páginas visitadas y tiempo de permanencia
• Cookies y tecnologías similares

NO almacenamos datos completos de tarjetas de crédito. Todos los pagos son procesados por proveedores certificados.`
  },
  {
    id: "roblox-oauth",
    icon: Gamepad2,
    title: "3. Vinculación de tu cuenta de Roblox (OAuth2)",
    content: `Para identificarte correctamente dentro del servidor de roleplay, ofrecemos la opción de vincular tu cuenta de Roblox mediante el sistema oficial de inicio de sesión de Roblox (OAuth 2.0).

Al vincular tu cuenta, solo solicitamos los permisos ("scopes") mínimos necesarios:
• openid — para confirmar de forma segura tu identidad de Roblox
• profile — para obtener tu nombre de usuario, tu nombre para mostrar, tu foto de perfil (avatar) y tu ID de usuario de Roblox

NO solicitamos acceso a tu contraseña de Roblox en ningún momento — la autenticación ocurre directamente en los servidores de Roblox, nunca la vemos ni la almacenamos.
NO solicitamos permisos sobre tus compras, tu inventario, tus Robux, tus grupos ni tus amigos.

Los datos obtenidos (username, nombre para mostrar, avatar e ID de Roblox) se usan exclusivamente para:
• Mostrar tu identidad real de Roblox en tu DNI digital y en tu panel de jugador
• Que el equipo de staff pueda identificarte correctamente dentro del servidor de ERLC
• Prevenir suplantación de identidad entre jugadores

Puedes desvincular tu cuenta de Roblox en cualquier momento desde tu panel de usuario o solicitándolo a soporte, y puedes revocar el acceso concedido directamente desde la configuración de tu cuenta de Roblox.`
  },
  {
    id: "uso",
    icon: Eye,
    title: "4. Uso de la Información",
    content: `Podemos compartir información con:
• Procesadores de pago
• Proveedores de servicios que nos ayudan a operar
• Autoridades legales cuando sea requerido por ley

Todos nuestros proveedores están obligados a proteger su información y usarla solo para los fines específicos acordados.`
  },
  {
    id: "proteccion",
    icon: Lock,
    title: "5. Protección de Datos",
    content: `Implementamos medidas de seguridad para proteger su información:

• Encriptación SSL/TLS en todas las comunicaciones
• Almacenamiento seguro con acceso restringido
• Monitoreo continuo de seguridad
• Copias de seguridad regulares
• Autenticación de dos factores disponible

A pesar de nuestros esfuerzos, ningún método de transmisión por Internet es 100% seguro. No podemos garantizar seguridad absoluta, pero trabajamos constantemente para proteger su información.`
  },
  {
    id: "compartir",
    icon: Share2,
    title: "6. Compartir Información",
    content: `NO vendemos su información personal a terceros.

Podemos compartir información con:
• Procesadores de pago (PayPal, Stripe, MercadoPago)
• Proveedores de servicios que nos ayudan a operar
• Autoridades legales cuando sea requerido por ley

Todos nuestros proveedores están obligados a proteger su información y usarla solo para los fines específicos acordados.`
  },
  {
    id: "retencion",
    icon: Clock,
    title: "7. Retención de Datos",
    content: `Conservamos su información personal mientras:

• Su cuenta esté activa
• Sea necesario para proporcionarle servicios
• Sea requerido por obligaciones legales
• Sea necesario para resolver disputas

Después de eliminar su cuenta, podemos retener cierta información durante un período limitado para cumplir con requisitos legales y resolver posibles disputas.`
  },
  {
    id: "derechos",
    icon: UserCheck,
    title: "8. Sus Derechos",
    content: `Usted tiene derecho a:

• Acceder a su información personal
• Corregir datos inexactos
• Solicitar la eliminación de sus datos
• Oponerse al procesamiento de sus datos
• Exportar sus datos en formato portable
• Retirar su consentimiento en cualquier momento

Para ejercer estos derechos, contacte a nuestro equipo de soporte.`
  },
  {
    id: "cookies",
    icon: Settings,
    title: "9. Cookies",
    content: `Utilizamos cookies y tecnologías similares para:

• Mantener su sesión activa
• Recordar sus preferencias
• Analizar el uso del sitio
• Mejorar nuestros servicios

Tipos de cookies que usamos:
• Esenciales: Necesarias para el funcionamiento del sitio
• Analíticas: Nos ayudan a entender cómo usa el sitio
• Funcionales: Mejoran su experiencia

Puede configurar su navegador para rechazar cookies, pero esto puede afectar la funcionalidad del sitio.`
  },
  {
    id: "menores",
    icon: Shield,
    title: "10. Menores de Edad",
    content: `Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos intencionalmente información de menores de 13 años.

Si es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos inmediatamente para tomar las medidas apropiadas.

Los usuarios entre 13 y 18 años deben tener el consentimiento de sus padres o tutores para usar nuestros servicios.`
  },
  {
    id: "cambios",
    icon: Settings,
    title: "11. Cambios a esta Política",
    content: `Podemos actualizar esta Política de Privacidad periódicamente. Los cambios serán publicados en esta página con una nueva fecha de "última actualización".

Para cambios significativos, le notificaremos por:
• Email (si tiene una cuenta)
• Aviso destacado en nuestro sitio web

Le recomendamos revisar esta política regularmente.`
  },
  {
    id: "contacto",
    icon: Mail,
    title: "12. Contacto",
    content: `Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, contáctenos:

• Email: erlchubstudios2025@gmail.com
• Discord: https://discord.gg/xKJqNX7uC3

Responderemos a su solicitud dentro de los 30 días hábiles.`
  }
];

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Política de Privacidad</span>
          </div>

          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-[#8e00f7]/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-[#8e00f7]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Política de Privacidad</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Su privacidad es importante para nosotros. Esta política explica cómo manejamos su información.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Última actualización: 5 de agosto de 2026
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#8e00f7]/10 to-[#a64dfa]/10 border border-[#8e00f7]/20 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#8e00f7]" />
              Resumen Rápido
            </h2>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#8e00f7] mt-1">+</span>
                NO vendemos su información personal a terceros
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8e00f7] mt-1">+</span>
                Sus datos de pago son procesados por proveedores certificados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8e00f7] mt-1">+</span>
                Usamos encriptación SSL para proteger sus datos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8e00f7] mt-1">+</span>
                Puede solicitar la eliminación de sus datos en cualquier momento
              </li>
            </ul>
          </div>

          <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Contenido</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#8e00f7] text-sm transition-colors py-1"
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
                className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-[#8e00f7]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="text-gray-400 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-[#8e00f7]/20 to-[#a64dfa]/20 border border-[#8e00f7]/30 rounded-2xl p-6 text-center">
            <p className="text-gray-300 mb-4">
              ¿Tienes preguntas sobre tu privacidad?
            </p>
            <Link
              href="https://mail.google.com/mail/?view=cm&to=erlchubstudios2025@gmail.com"
              className="inline-flex items-center gap-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 py-3 rounded-xl font-bold transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="h-5 w-5" />
              Contactar Privacidad
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}