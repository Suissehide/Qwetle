// js/game/config.js
window.Q = {};

// Random helpers (définis en premier car utilisés ci-dessous)
Q.random = (a, b) => {
    const alpha = Math.random();
    return a * (1.0 - alpha) + b * alpha;
};
Q.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
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
// Offsets fixes par session — décalage visuel des 3 couches de trail (style)
Q.strokeOffset = [
    Q.random(-1, 1) * 10,
    Q.random(-1, 1) * 10,
    Q.random(-1, 1) * 10,
];

// Physics
Q.gravity = 0.3;
Q.sparkThickness = 2.0;
Q.airDragSpark = 0.2;
Q.minPointerSpeed = 30;
