# Champ d'Herbe 3D — GPU Instancing avec Three.js ✨

Un renderer de gazon / champ d'herbe 3D utilisant **Three.js** avec **GPU instancing**, **shaders custom GLSL** pour la simulation de vent, et **contrôles caméra orbit**.

## Aperçu

Ce projet rend un champ d'herbe réaliste avec des milliers de brins d'herbe individuels en utilisant l'instancing GPU. Chaque brin est animé par un shader vertex personnalisé qui simule des vagues de vent naturelles, avec des variations aléatoires de hauteur, couleur et phase. Le tout fonctionne en temps réel avec des performances élevées.

## Démarrage rapide

```bash
# 1. Clone le dépôt
git clone https://github.com/ErwanBueche/grass-field-experiments.git
cd grass-field-experiments

# 2. Lance un serveur local (choisis une option)
# Option A — Python
python3 -m http.server

# Option B — Node.js
npx serve

# 3. Ouvre http://localhost:8000 (ou l'URL indiquée)
```

Ou tout simplement, ouvre le fichier `index.html` directement dans un navigateur moderne.

## Contrôles

| Action | Interaction |
|--------|-------------|
| **Orbiter** | Click + glisser |
| **Zoomer** | Molette de scroll |
| **Panoramiquer** | Click droit + glisser |

## Paramètres modifiables

Dans le code source (fichier `src/grass-field.js` et `src/main.js`), tu peux ajuster les paramètres suivants :

| Paramètre | Valeur par défaut | Description |
|-----------|-------------------|-------------|
| `count` | 50 000 | Nombre de brins d'herbe |
| `areaSize` | 50 | Taille de la zone (en unités) |
| `bladeHeight` | 0.8 | Hauteur de base des brins |
| `density` | 0.8 | Densité du champ |
| `windStrength` | 0.3 | Force du vent |
| `windFrequency` | 0.5 | Fréquence des vagues de vent |

## Structure du projet

```
grass-field-experiments/
├── index.html                # Point d'entrée, importmap Three.js
├── src/
│   ├── main.js               # Setup scène, lumières, animation loop
│   ├── grass-field.js        # Classe GrassField — InstancedMesh + matériau custom
│   └── shaders/
│       ├── grass.vert.glsl   # Vertex shader : vent, courbure, déplacement
│       └── grass.frag.glsl   # Fragment shader : couleur, variation, éclairage
└── README.md
```

## Stack technique

- **[Three.js](https://threejs.org/) r160+** — Moteur 3D WebGL
- **GLSL** — Shaders vertex et fragment personnalisés
- **ES Modules** — Architecture JavaScript modulaire
- **GPU Instancing** — `InstancedMesh` pour des performances optimales (50 000+ brins à 60 FPS)

## Captures d'écran

*(Ajoute ici une capture d'écran ou un GIF du rendu)*

## Crédits

Créé par [Erwan Bueche](https://github.com/ErwanBueche).

## Licence

MIT
