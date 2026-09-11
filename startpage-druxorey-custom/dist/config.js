export const DEFAULT_SHORTCUTS = [
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
    { id: 'clock', label: 'Heure & date' },
    { id: 'search', label: 'Recherche' },
    { id: 'network', label: 'Réseau / IP' },
    { id: 'shortcuts', label: 'Raccourcis' }
];
export const DEFAULT_MODULE_ORDER = MODULES.map(module => module.id);
