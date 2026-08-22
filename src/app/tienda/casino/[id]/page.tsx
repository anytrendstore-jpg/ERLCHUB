"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Dices, ChevronRight, Coins, Shield, Sparkles, Gift, Star, Minus, Plus, Trophy, Zap, Volume2, VolumeX } from "lucide-react";
import { casinoGames } from "@/lib/shopData";
import { useCasinoSounds } from "@/hooks/useCasinoSounds";

const rouletteSegments = [
  { prize: "x0.5", color: "#ef4444", probability: 25 },
  { prize: "x1.5", color: "#8e00f7", probability: 30 },
  { prize: "x2", color: "#22c55e", probability: 20 },
  { prize: "x3", color: "#fbbf24", probability: 15 },
  { prize: "x5", color: "#3b82f6", probability: 8 },
  { prize: "x10", color: "#ec4899", probability: 2 },
];

const mysteryPrizes = [
  { name: "Hub Coins x2", rarity: "common", color: "#9ca3af" },
  { name: "Kit Aleatorio", rarity: "uncommon", color: "#22c55e" },
  { name: "Vehículo Exclusivo", rarity: "rare", color: "#3b82f6" },
  { name: "Jackpot x10", rarity: "legendary", color: "#fbbf24" },
];

export default function CasinoGamePage() {
  const params = useParams();
  const game = casinoGames.find(g => g.id === params.id);
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showPrize, setShowPrize] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [boxState, setBoxState] = useState<"idle" | "shaking" | "opening" | "revealed">("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { playSound, stopSound } = useCasinoSounds();

  useEffect(() => {
    setMounted(true);
    setRotationDegree(0);
    if (game) {
      setBetAmount(game.minBet);
    }
  }, [game]);

  if (!game) {
    return (
      <main className="min-h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Juego no encontrado</h1>
          <Link href="/tienda" className="text-[#8e00f7] hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  const handlePlay = () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setResult(null);
    setShowPrize(false);

    if (soundEnabled) {
      playSound("click", 0.3);
    }

    if (game.type === "roulette") {
      if (soundEnabled) {
        playSound("spin", 0.5);
      }

      const randomPrize = rouletteSegments[Math.floor(Math.random() * rouletteSegments.length)];
      const segmentAngle = 360 / rouletteSegments.length;
      const prizeIndex = rouletteSegments.indexOf(randomPrize);
      const targetAngle = 1800 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);

      setRotationDegree(targetAngle);

      setTimeout(() => {
        if (soundEnabled) {
          stopSound("spin");
          if (parseFloat(randomPrize.prize.replace("x", "")) >= 1) {
            playSound("win", 0.6);
            playSound("coins", 0.4);
          } else {
            playSound("lose", 0.4);
          }
        }
        setResult(randomPrize.prize);
        setShowPrize(true);
        setIsPlaying(false);
      }, 4000);
    } else if (game.type === "mystery_box") {
      setBoxState("shaking");
      if (soundEnabled) {
        playSound("boxShake", 0.5);
      }

      setTimeout(() => {
        setBoxState("opening");
        if (soundEnabled) {
          playSound("boxOpen", 0.5);
        }
        const randomPrize = mysteryPrizes[Math.floor(Math.random() * mysteryPrizes.length)];

        setTimeout(() => {
          setBoxState("revealed");
          setResult(randomPrize.name);
          setShowPrize(true);
          setIsPlaying(false);
          if (soundEnabled) {
            playSound("win", 0.6);
            playSound("coins", 0.4);
          }
        }, 1000);
      }, 800);
    } else {
      if (soundEnabled) {
        playSound("ticket", 0.5);
      }
      setTimeout(() => {
        if (soundEnabled) {
          playSound("coins", 0.4);
        }
        setResult("Boleto registrado!");
        setShowPrize(true);
        setIsPlaying(false);
      }, 2000);
    }
  };

  const resetGame = () => {
    if (soundEnabled) {
      playSound("click", 0.3);
    }
    setResult(null);
    setShowPrize(false);
    setRotationDegree(0);
    setBoxState("idle");
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const GameIcon = game.type === "roulette" ? Sparkles : game.type === "mystery_box" ? Gift : Star;

  return (
    <main className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/tienda" className="hover:text-white">Tienda</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/tienda#casino" className="hover:text-white">Casino</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{game.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    soundEnabled
                      ? "bg-[#8e00f7]/20 text-[#8e00f7]"
                      : "bg-[#12121c] text-gray-500"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  {soundEnabled ? "Sonido ON" : "Sonido OFF"}
                </button>
              </div>

              <div className="aspect-video rounded-2xl bg-gradient-to-br from-[#ef4444]/20 via-[#8e00f7]/20 to-[#ef4444]/20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(142,0,247,0.1)_25%,rgba(142,0,247,0.1)_50%,transparent_50%,transparent_75%,rgba(142,0,247,0.1)_75%)] bg-[length:20px_20px]" />
                </div>

                {!mounted && (
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[#8e00f7] border-t-transparent animate-spin" />
                  </div>
                )}

                {mounted && game.type === "roulette" && (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-56 h-56 rounded-full bg-gradient-to-r from-[#8e00f7]/30 to-[#ef4444]/30 animate-pulse" />

                    <div
                      className="w-48 h-48 rounded-full relative shadow-2xl"
                      style={{
                        transform: `rotate(${rotationDegree}deg)`,
                        transition: isPlaying ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                        background: `conic-gradient(${rouletteSegments.map((seg, i) =>
                          `${seg.color} ${i * (360/rouletteSegments.length)}deg ${(i+1) * (360/rouletteSegments.length)}deg`
                        ).join(', ')})`,
                        boxShadow: '0 0 30px rgba(142, 0, 247, 0.4), inset 0 0 20px rgba(0,0,0,0.3)'
                      }}
                    >
                    
                      {rouletteSegments.map((seg, i) => {
                        const angle = (i * (360 / rouletteSegments.length)) + (360 / rouletteSegments.length / 2);
                        const radian = (angle - 90) * (Math.PI / 180);
                        const radius = 70; // Distance from center
                        const x = Math.cos(radian) * radius;
                        const y = Math.sin(radian) * radius;

                        return (
                          <div
                            key={seg.prize}
                            className="absolute font-bold text-white drop-shadow-lg"
                            style={{
                              left: '50%',
                              top: '50%',
                              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg)`,
                              fontSize: '14px',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {seg.prize}
                          </div>
                        );
                      })}

                
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#0c0c14] border-4 border-white/30 flex items-center justify-center z-10 shadow-inner">
                          <Sparkles className="h-6 w-6 text-[#8e00f7]" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
                    </div>

                    <div className="absolute w-52 h-52 rounded-full border-4 border-dashed border-white/10 animate-spin" style={{ animationDuration: '20s' }} />
                  </div>
                )}

                {game.type === "mystery_box" && (
                  <div className="relative">
                    <div
                      className={`w-32 h-32 rounded-2xl flex items-center justify-center relative
                        ${boxState === "idle" ? "animate-mystery-float animate-mystery-glow" : ""}
                        ${boxState === "shaking" ? "animate-mystery-shake" : ""}
                        ${boxState === "opening" ? "animate-mystery-open" : ""}
                      `}
                      style={{
                        background: 'linear-gradient(135deg, #8e00f7, #ef4444)',
                        perspective: '1000px'
                      }}
                    >
                      {boxState !== "revealed" ? (
                        <>
                          <Gift className="h-16 w-16 text-white" />
                          <div className="absolute inset-0 rounded-2xl border-2 border-white/30" />
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#fbbf24] rounded-full" />
                        </>
                      ) : (
                        <div className="animate-prize-reveal">
                          <Trophy className="h-16 w-16 text-[#fbbf24]" />
                        </div>
                      )}
                    </div>

                    {boxState === "idle" && (
                      <>
                        <div className="absolute -top-4 -left-4 w-2 h-2 bg-[#fbbf24] rounded-full animate-pulse" />
                        <div className="absolute -top-2 -right-6 w-3 h-3 bg-[#8e00f7] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute -bottom-4 -left-2 w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                        <div className="absolute -bottom-2 -right-4 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.7s' }} />
                      </>
                    )}
                  </div>
                )}

                {game.type === "lottery" && (
                  <div className={`relative ${isPlaying ? 'animate-pulse' : ''}`}>
                    <div className="w-48 h-32 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 animate-lottery-shimmer" />
                      <div className="text-center relative z-10">
                        <Star className="h-10 w-10 text-white mx-auto mb-2" />
                        <span className="text-white font-bold text-lg">SORTEO</span>
                      </div>
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/30" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-white/30" />
                    </div>
                  </div>
                )}

                {showPrize && result && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center animate-prize-reveal">
                      <Trophy className="h-16 w-16 text-[#fbbf24] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Resultado!</h3>
                      <p className="text-3xl font-bold text-[#8e00f7]">{result}</p>
                      <button
                        type="button"
                        onClick={resetGame}
                        className="mt-4 px-6 py-2 bg-[#8e00f7] hover:bg-[#a64dfa] text-white rounded-lg font-medium transition-colors"
                      >
                        Jugar de nuevo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 bg-gradient-to-r from-[#ef4444]/20 to-[#8e00f7]/20 text-[#ef4444]">
                CASINO
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">{game.name}</h1>
              <p className="text-gray-400 text-lg mb-6">{game.description}</p>

              <div className="bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6 mb-6">
                <div className="text-gray-400 mb-4">Cantidad a apostar</div>

                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSound("click", 0.2);
                      setBetAmount(Math.max(game.minBet, betAmount - 50));
                    }}
                    disabled={isPlaying}
                    className="w-12 h-12 rounded-xl bg-[#1a1a28] flex items-center justify-center text-white hover:bg-[#2a2a3a] transition-colors disabled:opacity-50"
                  >
                    <Minus className="h-5 w-5" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2 text-3xl font-bold text-[#8e00f7]">
                    <Coins className="h-7 w-7" />
                    {betAmount.toLocaleString()}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSound("click", 0.2);
                      setBetAmount(Math.min(game.maxBet, betAmount + 50));
                    }}
                    disabled={isPlaying}
                    className="w-12 h-12 rounded-xl bg-[#1a1a28] flex items-center justify-center text-white hover:bg-[#2a2a3a] transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  {[game.minBet, Math.round((game.minBet + game.maxBet) / 4), Math.round((game.minBet + game.maxBet) / 2), game.maxBet].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playSound("click", 0.2);
                        setBetAmount(amount);
                      }}
                      disabled={isPlaying}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        betAmount === amount
                          ? "bg-[#8e00f7] text-white"
                          : "bg-[#1a1a28] text-gray-400 hover:bg-[#2a2a3a]"
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlay}
                disabled={isPlaying}
                className="w-full bg-gradient-to-r from-[#ef4444] to-[#8e00f7] hover:opacity-90 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mb-6"
              >
                {isPlaying ? (
                  <>
                    <Zap className="h-5 w-5 animate-pulse" />
                    Jugando...
                  </>
                ) : (
                  <>
                    <Dices className="h-5 w-5" />
                    Jugar Ahora!
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-[#8e00f7]" />
                  Juego justo
                </div>
                <div>
                  Min: <span className="text-white">{game.minBet} HC</span>
                </div>
                <div>
                  Max: <span className="text-white">{game.maxBet} HC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Posibles premios</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(game.type === "roulette" ? rouletteSegments.map(s => s.prize) : mysteryPrizes.map(p => p.name)).slice(0, 4).map((prize, index) => (
                <div
                  key={index}
                  className="bg-[#12121c] border border-[#1a1a28] rounded-xl p-4 text-center casino-card-hover"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ef4444]/20 to-[#8e00f7]/20 flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-[#8e00f7]" />
                  </div>
                  <span className="text-white font-medium">{prize}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-[#12121c] border border-[#1a1a28] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Términos importantes</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Las apuestas se realizan exclusivamente con Hub Coins.</li>
              <li>Los resultados son aleatorios y verificables.</li>
              <li>Los premios se entregan inmediatamente al ganar.</li>
              <li>Las apuestas realizadas no son reembolsables.</li>
              <li>Juega responsablemente. Establece límites.</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}