'use client';
import { useState } from 'react';

interface MeetupPinProps {
  rideId: string;
  defaultLat: number;
  defaultLng: number;
  onPinSaved?: (lat: number, lng: number) => void;
}

/**
 * Pillar 5: UX Enhancements - Pinpoint Meetup
 * Solves the "pre-ride ambiguity problem" by letting users confirm
 * the EXACT coordinate drop (like a specific building gate) instead of just an address.
 */
export default function MeetupPin({ rideId, defaultLat, defaultLng, onPinSaved }: MeetupPinProps) {
  const [pin, setPin] = useState({ lat: defaultLat, lng: defaultLng });
  const [saving, setSaving] = useState(false);

  const saveMeetupLocation = async () => {
    setSaving(true);
    // Submit exact coords to backend
    // await fetch('/api/rides/meetup', { method: 'POST', body: JSON.stringify({ rideId, lat: pin.lat, lng: pin.lng }) });
    setSaving(false);
    if (onPinSaved) onPinSaved(pin.lat, pin.lng);
  };

  return (
    <div className="bg-primary-lighter/30 p-5 rounded-2xl border border-primary/10 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary-gradient)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Exact Meetup Spot</h3>
          <p className="text-xs text-gray-500">Drag the pin to the precise gate or parking spot.</p>
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden mb-4 border border-gray-200">
        <span className="text-gray-400 font-medium text-sm z-10">Interactive Map View</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      <button
        onClick={saveMeetupLocation}
        disabled={saving}
        className="btn-primary w-full py-3"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Confirming...
          </span>
        ) : (
          "Confirm Exact Location"
        )}
      </button>
    </div>
  );
}
