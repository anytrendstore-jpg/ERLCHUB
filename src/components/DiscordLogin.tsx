"use client";

import { useState } from "react";
import Image from "next/image";

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'https://www.erlchub.pro/api/auth/callback/discord';

const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds+guilds.members.read`;

export default function DiscordLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    window.location.href = DISCORD_OAUTH_URL;
  };

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Image
  src="/discord-logo.svg"
  alt="Discord"
  width={20}
  height={20}
  className="h-5 w-5"
/>
      {isLoading ? "Conectando con Discord..." : "Iniciar con Discord"}
    </button>
  );
}
