'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Radio as RadioLucide, Users, Send, LogOut, SignalHigh, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { RADIO_CHANNELS } from '@/lib/radioChannels';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

interface ChannelState {
  id: string;
  name: string;
  frequency: string;
  connected: number;
}

interface RadioMsg {
  id: string;
  channelId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface ChannelUser {
  discordId: string;
  username: string;
  voiceEnabled: boolean;
}

type PeerStatus = 'connecting' | 'connected' | 'failed';

const POLL_MS = 6000;
const POLL_MS_VOICE = 3000;
const SIGNAL_POLL_MS = 1500;
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function RadioApp() {
  const { session } = useDiscordAuth();
  const myId = session?.user?.id;

  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelState[]>(RADIO_CHANNELS.map((c) => ({ ...c, connected: 0 })));
  const [messages, setMessages] = useState<RadioMsg[]>([]);
  const [usersInChannel, setUsersInChannel] = useState<ChannelUser[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voz ---
  const [voiceOn, setVoiceOn] = useState(false);
  const [talking, setTalking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [peerStatus, setPeerStatus] = useState<Record<string, PeerStatus>>({});
  const [remoteTalking, setRemoteTalking] = useState<Record<string, boolean>>({});

  const voiceOnRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement | null>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const [, forceUpdate] = useState(0);

  /** Detector de "está hablando" sobre el audio remoto real (nivel de volumen), no un estado inventado ni una señal extra por la red. */
  const attachTalkingDetector = useCallback((peerId: string, stream: MediaStream) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analysersRef.current.set(peerId, analyser);
    } catch {
      // Sin Web Audio disponible, simplemente no hay indicador de "hablando" — el audio en sí sigue funcionando.
    }
  }, []);

  useEffect(() => {
    const data = new Uint8Array(256);
    const interval = setInterval(() => {
      if (analysersRef.current.size === 0) return;
      setRemoteTalking((prev) => {
        let changed = false;
        const next = { ...prev };
        Array.from(analysersRef.current.entries()).forEach(([peerId, analyser]) => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = data[i] - 128; sum += v * v; }
          const rms = Math.sqrt(sum / data.length);
          const isTalking = rms > 6;
          if (Boolean(next[peerId]) !== isTalking) { next[peerId] = isTalking; changed = true; }
        });
        return changed ? next : prev;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const sendSignal = useCallback(async (toId: string, type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => {
    try {
      await fetch('/api/radio/voice/signal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toId, type, payload }),
      });
    } catch {
      // Silencioso: el próximo poll de estado va a reintentar la negociación si hace falta.
    }
  }, []);

  const cleanupPeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) { pc.close(); pcsRef.current.delete(peerId); }
    pendingCandidatesRef.current.delete(peerId);
    remoteStreamsRef.current.delete(peerId);
    audioElsRef.current.delete(peerId);
    analysersRef.current.delete(peerId);
    setPeerStatus((prev) => { const next = { ...prev }; delete next[peerId]; return next; });
    setRemoteTalking((prev) => { const next = { ...prev }; delete next[peerId]; return next; });
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal(peerId, 'ice-candidate', e.candidate.toJSON()); };
    pc.ontrack = (e) => {
      remoteStreamsRef.current.set(peerId, e.streams[0]);
      attachTalkingDetector(peerId, e.streams[0]);
      forceUpdate((n) => n + 1);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setPeerStatus((prev) => ({ ...prev, [peerId]: 'connected' }));
      else if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        setPeerStatus((prev) => ({ ...prev, [peerId]: 'failed' }));
      }
    };
    pcsRef.current.set(peerId, pc);
    setPeerStatus((prev) => ({ ...prev, [peerId]: 'connecting' }));
    return pc;
  }, [sendSignal, attachTalkingDetector]);

  const initiateOffer = useCallback(async (peerId: string) => {
    const pc = createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(peerId, 'offer', offer);
    } catch {
      cleanupPeer(peerId);
    }
  }, [createPeerConnection, sendSignal, cleanupPeer]);

  /** Solo un lado de cada par inicia la oferta (el de id "menor") — evita glare sin necesitar perfect-negotiation. */
  const syncVoicePeers = useCallback((users: ChannelUser[]) => {
    if (!voiceOnRef.current || !myId) return;
    const voiceUsers = users.filter((u) => u.voiceEnabled && u.discordId !== myId);
    const currentIds = new Set(voiceUsers.map((u) => u.discordId));
    for (const peerId of Array.from(pcsRef.current.keys())) {
      if (!currentIds.has(peerId)) cleanupPeer(peerId);
    }
    for (const u of voiceUsers) {
      if (pcsRef.current.has(u.discordId)) continue;
      if (myId < u.discordId) initiateOffer(u.discordId);
    }
  }, [myId, cleanupPeer, initiateOffer]);

  const pollSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/radio/voice/signal', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) return;
      for (const sig of data.signals as { fromId: string; type: string; payload: any }[]) {
        if (sig.type === 'offer') {
          let pc = pcsRef.current.get(sig.fromId);
          if (!pc) pc = createPeerConnection(sig.fromId);
          await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          const queued = pendingCandidatesRef.current.get(sig.fromId) || [];
          for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          pendingCandidatesRef.current.delete(sig.fromId);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal(sig.fromId, 'answer', answer);
        } else if (sig.type === 'answer') {
          const pc = pcsRef.current.get(sig.fromId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            const queued = pendingCandidatesRef.current.get(sig.fromId) || [];
            for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            pendingCandidatesRef.current.delete(sig.fromId);
          }
        } else if (sig.type === 'ice-candidate') {
          const pc = pcsRef.current.get(sig.fromId);
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.payload)).catch(() => {});
          } else {
            const arr = pendingCandidatesRef.current.get(sig.fromId) || [];
            arr.push(sig.payload);
            pendingCandidatesRef.current.set(sig.fromId, arr);
          }
        } else if (sig.type === 'leave') {
          cleanupPeer(sig.fromId);
        }
      }
    } catch {
      // Silencioso: se reintenta en el próximo poll.
    }
  }, [createPeerConnection, sendSignal, cleanupPeer]);

  const poll = useCallback(async () => {
    try {
      const url = activeChannel ? `/api/radio/state?channelId=${activeChannel}` : '/api/radio/state';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) return;
      setChannels(data.channels);
      if (activeChannel) {
        setMessages(data.messages);
        setUsersInChannel(data.usersInChannel);
        syncVoicePeers(data.usersInChannel);
      }
    } catch {
      // Silencioso: se mantiene el último estado conocido.
    }
  }, [activeChannel, syncVoicePeers]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, voiceOn ? POLL_MS_VOICE : POLL_MS);
    return () => clearInterval(interval);
  }, [poll, voiceOn]);

  useEffect(() => {
    if (!voiceOn) return;
    pollSignals();
    const interval = setInterval(pollSignals, SIGNAL_POLL_MS);
    return () => clearInterval(interval);
  }, [voiceOn, pollSignals]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopVoice = useCallback(async (notify: boolean) => {
    voiceOnRef.current = false;
    setVoiceOn(false);
    setTalking(false);
    for (const peerId of Array.from(pcsRef.current.keys())) cleanupPeer(peerId);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (notify) {
      await fetch('/api/radio/voice/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voiceEnabled: false }) }).catch(() => {});
    }
  }, [cleanupPeer]);

  const tune = async (channelId: string | null) => {
    await stopVoice(false);
    setActiveChannel(channelId);
    setMessages([]);
    setUsersInChannel([]);
    setMicError(null);
    await fetch('/api/radio/tune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
  };

  const startVoice = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((t) => { t.enabled = false; });
      localStreamRef.current = stream;
      voiceOnRef.current = true;
      setVoiceOn(true);
      await fetch('/api/radio/voice/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voiceEnabled: true }) });
      syncVoicePeers(usersInChannel);
    } catch {
      setMicError('No se pudo acceder al micrófono. Revisá los permisos del navegador.');
    }
  };

  useEffect(() => () => { stopVoice(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setTransmitting = (on: boolean) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = on; });
    setTalking(on);
  };

  const sendMessage = async () => {
    if (!activeChannel || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/radio/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannel, text: draft.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDraft('');
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setSending(false);
    }
  };

  const activeChannelInfo = channels.find((c) => c.id === activeChannel);
  const voiceUsers = usersInChannel.filter((u) => u.voiceEnabled);

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Audio remoto — nunca visible, solo reproduce lo que llega por WebRTC. */}
      {Array.from(remoteStreamsRef.current.entries()).map(([peerId, stream]) => (
        <audio
          key={peerId}
          autoPlay
          ref={(el) => {
            audioElsRef.current.set(peerId, el);
            if (el && el.srcObject !== stream) el.srcObject = stream;
          }}
        />
      ))}

      {/* Lista de canales */}
      <div className="w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <RadioLucide className="w-5 h-5 text-orange-400" /> Radio
          </h2>
          <p className="text-white/40 text-xs mt-1">Cambio rápido de frecuencia</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => tune(c.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors text-left
                ${activeChannel === c.id ? 'bg-orange-600/20 border border-orange-500/40' : 'hover:bg-white/5 border border-transparent'}
              `}
            >
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                <p className="text-white/40 text-[11px]">{c.frequency} MHz</p>
              </div>
              <div className="flex items-center gap-1 text-white/50 text-xs flex-shrink-0">
                {c.connected > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <Users className="w-3 h-3" /> {c.connected}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Canal activo */}
      <div className="flex-1 flex flex-col">
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <SignalHigh className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Selecciona una frecuencia para sintonizar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
              <div>
                <p className="text-white font-semibold text-sm">{activeChannelInfo?.name}</p>
                <p className="text-white/40 text-[11px]">{activeChannelInfo?.frequency} MHz · {usersInChannel.length} conectado(s)</p>
              </div>
              <div className="flex items-center gap-2">
                {voiceOn ? (
                  <button
                    onClick={() => stopVoice(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" /> Voz activa
                  </button>
                ) : (
                  <button
                    onClick={startVoice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
                  >
                    <MicOff className="w-3.5 h-3.5" /> Activar voz
                  </button>
                )}
                <button
                  onClick={() => tune(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Salir
                </button>
              </div>
            </div>

            {micError && (
              <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {micError}
              </div>
            )}

            {voiceOn && (
              <div className="px-4 pt-3 flex-shrink-0">
                <button
                  onMouseDown={() => setTransmitting(true)}
                  onMouseUp={() => setTransmitting(false)}
                  onMouseLeave={() => talking && setTransmitting(false)}
                  onTouchStart={(e) => { e.preventDefault(); setTransmitting(true); }}
                  onTouchEnd={(e) => { e.preventDefault(); setTransmitting(false); }}
                  className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 select-none transition-colors ${
                    talking ? 'bg-red-600 text-white' : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  <Mic className="w-4 h-4" /> {talking ? 'Transmitiendo...' : 'Mantené presionado para hablar'}
                </button>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                  {messages.length === 0 && (
                    <p className="text-white/30 text-sm text-center mt-8">Sin transmisiones todavía en este canal.</p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-2 items-baseline">
                      <span className="text-orange-400 text-xs font-semibold flex-shrink-0">{m.username}:</span>
                      <span className="text-white/80 text-sm">{m.text}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Transmitir mensaje..."
                    maxLength={200}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !draft.trim()}
                    className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="w-48 border-l border-white/5 p-3 overflow-y-auto custom-scrollbar">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-2">Conectados</p>
                <div className="space-y-1.5">
                  {usersInChannel.map((u) => (
                    <div key={u.discordId} className="flex items-center gap-2 text-white/70 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="truncate flex-1">{u.username}</span>
                      {u.voiceEnabled && (
                        <Mic
                          className={`w-3 h-3 flex-shrink-0 ${remoteTalking[u.discordId] ? 'text-red-400 animate-pulse' : peerStatus[u.discordId] === 'connected' ? 'text-emerald-400' : peerStatus[u.discordId] === 'failed' ? 'text-red-400' : 'text-amber-400'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {voiceUsers.length > 0 && (
                  <p className="text-white/30 text-[10px] mt-3">{voiceUsers.length} con micrófono activo</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
