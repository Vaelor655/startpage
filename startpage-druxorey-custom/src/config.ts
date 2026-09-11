export type Shortcut = {
  id: string;
  name: string;
  url: string;
  category: string;
};

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'protonmail', name: 'Proton Mail', url: 'https://mail.proton.me/', category: 'Communication' },
  { id: 'messenger', name: 'Messenger', url: 'https://www.messenger.com/', category: 'Communication' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/', category: 'Média' },
  { id: 'youtube-music', name: 'YouTube Music', url: 'https://music.youtube.com/', category: 'Média' },
  { id: 'soundcloud', name: 'SoundCloud', url: 'https://soundcloud.com/', category: 'Média' },
  { id: 'twitch', name: 'Twitch', url: 'https://www.twitch.tv/', category: 'Média' },
  { id: 'primevideo', name: 'Prime Video', url: 'https://www.primevideo.com/', category: 'Média' },
  { id: 'anime-sama', name: 'Anime-Sama', url: 'https://anime-sama.to/', category: 'Média' },
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com/', category: 'Social' },
  { id: 'x', name: 'X', url: 'https://x.com/', category: 'Social' },
  { id: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com/', category: 'Social' },
  { id: 'dpm', name: 'DPM.LOL', url: 'https://dpm.lol/', category: 'Gaming' },
  { id: 'steamrip', name: 'SteamRIP', url: 'https://steamrip.com/', category: 'Gaming' },
  { id: 'openfront', name: 'OpenFront', url: 'https://openfront.io/', category: 'Gaming' }
];

export const MODULES = [
  { id: 'portrait', label: 'Illustration' },
  { id: 'clock', label: 'Heure & date' },
  { id: 'search', label: 'Recherche' },
  { id: 'network', label: 'Réseau / IP' },
  { id: 'shortcuts', label: 'Raccourcis' }
] as const;

/** Position/taille d'un module, en fraction (0-1) de la largeur du tableau de bord pour x/w, en pixels pour y/h. */
export type ModuleLayout = { xFrac: number; wFrac: number; y: number; h: number | null };

const RIGHT_COLUMN_X = 0.37;
const RIGHT_COLUMN_W = 0.63;

/** y est recalculé au premier lancement (et lors d'une réinitialisation) à partir du rendu réel des modules. */
export const DEFAULT_MODULE_LAYOUT: Record<string, ModuleLayout> = {
  portrait: { xFrac: 0, wFrac: 0.34, y: 0, h: 460 },
  clock: { xFrac: RIGHT_COLUMN_X, wFrac: RIGHT_COLUMN_W, y: 0, h: null },
  search: { xFrac: RIGHT_COLUMN_X, wFrac: RIGHT_COLUMN_W, y: 0, h: null },
  network: { xFrac: RIGHT_COLUMN_X, wFrac: RIGHT_COLUMN_W, y: 0, h: null },
  shortcuts: { xFrac: RIGHT_COLUMN_X, wFrac: RIGHT_COLUMN_W, y: 0, h: null }
};
