import { useEffect, useState } from 'react';
import api from '../api/client';

export type Settings = Record<string, string>;

// Seed values, shown until /settings answers or if it never does
export const DEFAULT_PHONE = '+79178765958';
export const DEFAULT_ADDRESS = 'д. Званка, ул. Приозёрная, д. 58';
export const DEFAULT_HOURS = '9:00 – 21:00';

let cached: Settings = {};
let inFlight: Promise<Settings> | null = null;

function loadSettings(): Promise<Settings> {
  if (!inFlight) {
    inFlight = api
      .get('/settings')
      .then(({ data }) => {
        cached = data || {};
        return cached;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

// Shows the last known values right away and refreshes them on every mount
export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(cached);

  useEffect(() => {
    let alive = true;
    loadSettings()
      .then((fresh) => {
        if (alive) setSettings(fresh);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}
