# Custom Startpage — base druxorey/startpage

Version personnalisée inspirée de `druxorey/startpage` (GPL-3.0), conservant sa logique de thèmes et son esthétique minimaliste, avec une implémentation remaniée et modulable.

## Fonctionnalités

- Heure et date en français.
- Recherche Google / DuckDuckGo / Brave sélectionnable dans les paramètres.
- Tous les thèmes sombres et clairs du projet d'origine.
- IP publique via `api.ipify.org`.
- IP locale : endpoint `/api/client-ip` quand la page est servie avec `npm run start`; tentative WebRTC sinon.
- Module « portrait » affichant une image personnalisable (`public/portrait.png`).
- Modules affichables/masquables.
- Modules librement déplaçables (poignée ⠿) et redimensionnables (coin ↘) avec le bouton `modifier`.
- Disposition adaptée automatiquement en une colonne sur mobile.
- Raccourcis réordonnables par glisser-déposer.
- Ajout, suppression, modification et catégorisation des raccourcis depuis les paramètres.
- Configuration sauvegardée dans `localStorage` du navigateur.
- Installable comme extension Chrome/Chromium (nouvel onglet), sans serveur.

## Extension Chrome (sans serveur)

Le dossier `dist/` est aussi une extension Chrome/Chromium valide (Manifest V3) qui remplace la page de nouvel onglet — plus besoin d'héberger quoi que ce soit.

1. `npm install && npm run build` (ou récupère directement le dossier `dist/` déjà buildé).
2. Ouvre `chrome://extensions`, active le **Mode développeur** (en haut à droite).
3. Clique sur **Charger l'extension non empaquetée** et sélectionne le dossier `dist/`.
4. Ouvre un nouvel onglet : c'est ta startpage.

Tout fonctionne en local (thèmes, disposition, raccourcis, image portrait) via `localStorage` du navigateur. Seule différence par rapport au mode serveur : l'IP locale n'a plus d'endpoint `/api/client-ip` à interroger, donc elle repose uniquement sur la détection WebRTC (le module affiche « non exposée » si le navigateur la bloque). Pense à relancer `npm run build` puis à cliquer sur l'icône ↻ dans `chrome://extensions` après une modification du code.

## Démarrage immédiat (mode serveur)

Le ZIP contient déjà un dossier `dist/` prêt à servir. Avec Node.js 18+ :

```bash
node server.mjs
```

Puis ouvre `http://IP_DU_SERVEUR:8080`. Aucun `npm install` n'est nécessaire pour ce mode.

## Développement

```bash
npm install
npm run dev
```

Mode développement : `http://IP_DU_SERVEUR:5173`.

## Hébergement recommandé avec IP locale fiable

```bash
npm install
npm run build
npm run start
```

Par défaut le serveur écoute sur `0.0.0.0:8080`. Depuis un autre poste du LAN :

```text
http://IP_DU_SERVEUR:8080
```

Le serveur Node ne fait qu'héberger les fichiers statiques et exposer `/api/client-ip`.

Variables optionnelles :

```bash
HOST=127.0.0.1 PORT=8080 npm run start
```

## Docker (Linux)

```bash
docker compose up -d --build
```

Le compose utilise le réseau `host` pour que le serveur voie correctement l'IP LAN du navigateur.

## Hébergement Nginx

Le dossier `dist/` peut être servi directement par Nginx après `npm run build`. Dans ce mode purement statique, l'IP publique fonctionne mais l'IP locale peut être masquée par les protections WebRTC du navigateur. Pour conserver l'IP locale fiable, proxifier `/api/client-ip` vers `server.mjs` ou servir toute la page avec `npm run start`.

## Personnalisation

Les raccourcis par défaut sont dans `src/config.ts`, mais ils sont aussi modifiables directement depuis la page. La configuration personnelle du navigateur prend ensuite le dessus via `localStorage`.

L'image du module « portrait » est `public/portrait.png` (copiée telle quelle dans `dist/` au build). Remplace ce fichier par ta propre image puis relance `npm run build` pour la mettre à jour.

## Crédits / licence

Base et inspiration : https://github.com/druxorey/startpage — GPL-3.0.
Cette version conserve la licence GPL-3.0. Voir `LICENSE`.
