"use client";

import { useState } from "react";
import Image from "next/image";

const ROBLOX_CLIENT_ID = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_ROBLOX_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/roblox';

const ROBLOX_OAUTH_URL = `https://www.roblox.com/oauth2/authorize?client_id=${ROBLOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid&prompt=login`;

export default function RobloxLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRobloxLogin = () => {
    setIsLoading(true);
    window.location.href = ROBLOX_OAUTH_URL;
  };

  return (
    <button
      onClick={handleRobloxLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-[#00A2FF] hover:bg-[#0080CC] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Image
  src="/roblox-logo.png"
  alt="Roblox"
  width={20}
  height={20}
  className="h-5 w-5"
/>
      {isLoading ? "Conectando con Roblox..." : "Iniciar con Roblox"}
    </button>
  );
}
