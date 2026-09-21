// js/game/config.js
window.Q = {};

// Random helpers (définis en premier car utilisés ci-dessous)
Q.random = (a, b) => {
    const alpha = Math.random();
    return a * (1.0 - alpha) + b * alpha;
};
Q.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
Q.clamp = (value, min, max) => Math.min(max, Math.max(min, value));
Q.pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
Q.shuffle = array => {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

// Math constants
Q.PI = Math.PI;
Q.TAU = Math.PI * 2;

// Colors
Q.cubeColor = ["#2F4157", "#E94767", "#EF8096"];

// Materials partagés par couleur — MeshLambertMaterial (léger) au lieu de MeshPhysicalMaterial (PBR lourd)
if (typeof THREE === 'undefined') throw new Error('[Q] Three.js doit être chargé avant config.js');
Q.materials = new Map();
Q.cubeColor.forEach(color => {
    Q.materials.set(color, new THREE.MeshLambertMaterial({
        color: parseInt(color.replace("#", "0x"), 16)
    }));
});

// Spawn timing — getSpawnDelay référence Q.state qui sera défini dans state.js (OK car appelé au runtime)
Q.getSpawnDelay = () => {
    const spawnDelayMax = 1400;
    const spawnDelayMin = 550;
    const spawnDelay = spawnDelayMax - Q.state.game.cubeCount * 3.1;
    return Math.max(spawnDelay, spawnDelayMin);
};

// Trail config
Q.touchTrailThickness = 15;
Q.touchPointLife = 140;

// En deçà de ce déplacement, la lame est considérée immobile et n'empile plus
// de points : sinon trois pastilles restent posées sous un curseur à l'arrêt.
Q.touchPointMinStep = 1.5;
// Au-delà, le geste a sauté trop loin en une frame : on jalonne le trajet pour
// que la courbe reste dense quelle que soit la vitesse de la souris.
Q.touchPointMaxStep = 22;
// Garde-fou : un curseur qui traverse l'écran d'un coup ne doit pas créer
// cinquante points d'un seul appel.
Q.touchPointMaxInserts = 8;

// Les trois lames restent parallèles, décalées perpendiculairement au geste.
// La normale plutôt qu'une diagonale fixe : la frange garde la même largeur quel
// que soit le sens du slash, là où un décalage en diagonale faisait disparaître
// l'écart dès qu'on tranchait dans cette même diagonale.
Q.touchTrailSpread = 10;
Q.trailOffset = [-Q.touchTrailSpread, 0, Q.touchTrailSpread];
// … sauf à l'avant : l'écart se referme sur la tête du geste, sur cette
// fraction de la traînée, pour que les trois pointes se rejoignent en une seule
// au lieu de finir côte à côte. Une fraction plutôt qu'une distance fixe : la
// pointe garde la même allure quelle que soit la vitesse du geste.
Q.touchTrailTipRatio = 0.35;

// Chaque lame vagabonde légèrement autour de son décalage, pour que le tracé ne
// soit pas trois copies au pixel près. wander = pas de la marche aléatoire,
// jitter = écart maximal toléré.
Q.touchTrailWander = 0.35;
Q.touchTrailJitter = 2.5;
Q.trailDrift = [0, 0, 0];

// Même principe sur l'épaisseur : une dérive lente plutôt qu'un tirage par
// point, qui hacherait le ruban.
Q.touchTrailThicknessWander = 0.03;
Q.touchTrailThicknessJitter = 0.12;
Q.trailThicknessDrift = 0;

Q.makeTouchPoint = (x, y) => {
    for (let k = 0; k < Q.trailDrift.length; k++) {
        Q.trailDrift[k] = Q.clamp(
            Q.trailDrift[k] + Q.random(-1, 1) * Q.touchTrailWander,
            -Q.touchTrailJitter,
            Q.touchTrailJitter
        );
    }
    Q.trailThicknessDrift = Q.clamp(
        Q.trailThicknessDrift + Q.random(-1, 1) * Q.touchTrailThicknessWander,
        -Q.touchTrailThicknessJitter,
        Q.touchTrailThicknessJitter
    );
    return {
        x,
        y,
        life: Q.touchPointLife,
        drift: Q.trailDrift.slice(),
        thickness: 1 + Q.trailThicknessDrift,
        nx: 0,                 // normale à la trajectoire, recalculée au dessin
        ny: 0,
        tip: 1,                // refermeture de l'écart près de la pointe, idem
    };
};

// Écart signé de la lame k au point p, le long de la normale au geste, refermé
// à l'approche de la pointe avant.
Q.lameSpread = (p, k) => (Q.trailOffset[k] + p.drift[k]) * p.tip;

// Physics
Q.gravity = 0.3;
Q.sparkThickness = 2.0;
Q.airDragSpark = 0.2;
Q.minPointerSpeed = 30;
