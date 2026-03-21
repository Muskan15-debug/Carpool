'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface EtaCardProps {
  rideId: string;
  initialEtaMinutes: number;
}

/**
 * Pillar 5: UX Enhancements - ETA Countdown as Primary UI
 * The home screen becomes a single large ETA card rather than lists.
 * One clear number that updates via WebSockets instantly.
 */
export default function EtaCard({ rideId, initialEtaMinutes }: EtaCardProps) {
  const [eta, setEta] = useState(initialEtaMinutes);
  const [distance, setDistance] = useState("0.0");
  const [liveLocation, setLiveLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join-ride", rideId);

    socket.on("ride:location_update", (data: any) => {
      if (data.etaMinutes) setEta(data.etaMinutes);
      if (data.lat && data.lng) setLiveLocation({ lat: data.lat, lng: data.lng });
      if (data.distanceRemaining) setDistance((data.distanceRemaining / 1000).toFixed(1));
    });

    return () => {
      socket.off("ride:location_update");
    };
  }, [rideId]);

  return (
    <div className="rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all text-white" style={{ background: 'var(--primary-gradient)' }}>
      {/* Decorative background shapes */}
      <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <p className="text-white/70 font-medium text-sm tracking-wide uppercase mb-1">Driver arrives in</p>
        <div className="flex items-baseline gap-2">
          <h1 className="text-6xl font-bold tracking-tighter">{eta}</h1>
          <span className="text-2xl font-medium text-white/70">min</span>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-white/50 uppercase tracking-widest">Car Distance</span>
            <span className="font-semibold text-lg">{distance} km away</span>
          </div>
          <button className="bg-white text-primary px-5 py-2 rounded-full font-bold text-sm shadow-sm hover:scale-105 transition-transform">
            View Live Map
          </button>
        </div>
      </div>
    </div>
  );
}
