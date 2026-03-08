// js/game/cubes.js

// Géométrie partagée (créée une seule fois)
const _cubeSize = 1.5;
const _geometry = (() => {
    const shape = new THREE.Shape();
    const eps = 0.00001;
    const radius = _cubeSize / 4 - eps;
    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, _cubeSize - radius * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(_cubeSize - radius * 2, _cubeSize - radius * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(_cubeSize - radius * 2, eps, eps, 0, -Math.PI / 2, true);
    const geo = new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: _cubeSize - (_cubeSize / 4) * 2,
        bevelEnabled: true,
        bevelThickness: _cubeSize / 4,
        bevelSize: radius,
        bevelOffset: 0,
        bevelSegments: 30,
        curveSegments: 15,
    });
    geo.center();
    return geo;
})();

Q.cubeSlashObject = {
    scene: null,
    cubes: [],
    axisOptions: [['x', 'y'], ['y', 'z'], ['z', 'x']],
    speed: 0.04,
    targetHitRadius: 50,
    targetRadius: -20,
    spawnRadius: Math.min(200 * 0.8, 20),
    gravity: -3.5,

    create(scene) {
        this.scene = scene;
        const color = Q.pickOne(Q.cubeColor);
        // Material partagé par couleur — pas de new MeshPhysicalMaterial() à chaque spawn
        const material = Q.materials.get(color);
        const group = new THREE.Group();

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    const cube = new THREE.Mesh(_geometry, material);
                    cube.castShadow = true;

                    cube.userData.rotateXD = 0;
                    cube.userData.rotateYD = 0;
                    cube.userData.rotateZD = 0;

                    const axes = Q.pickOne(this.axisOptions);
                    [Math.random() * 0.6, Math.random() * 0.6].forEach((speed, idx) => {
                        cube.userData[`rotate${axes[idx].toUpperCase()}D`] = speed;
                    });

                    const offset = _cubeSize / 2.8;
                    cube.position.set(
                        (i - 1) * (_cubeSize - offset),
                        (j - 1) * (_cubeSize - offset),
                        (k - 1) * (_cubeSize - offset)
                    );
                    cube.userData.positionXD = (i - 1) * Q.randomInt(1, 4);
                    cube.userData.positionYD = (j - 1) * Q.randomInt(1, 4);
                    cube.userData.positionZD = (k - 1) * Q.randomInt(1, 4);

                    group.add(cube);
                }
            }
        }

        group.position.x = (Math.random() * this.spawnRadius) - (this.spawnRadius * 2);
        group.position.y = _cubeSize;
        group.position.z = (Math.random() * this.targetRadius) - this.targetRadius + 70;
        group.userData.positionXD = Math.random() * (-group.position.x / 6) + 1;
        group.userData.positionZD = -25;

        group.userData.rotateXD = 0;
        group.userData.rotateYD = 0;
        group.userData.rotateZD = 0;

        const axes = Q.pickOne(this.axisOptions);
        [Math.random() * 0.6, Math.random() * 0.6].forEach((speed, idx) => {
            group.userData[`rotate${axes[idx].toUpperCase()}D`] = speed;
        });

        group.callback = function () { this.userData.hit = true; };
        group.userData.health = 1;
        group.userData.hit = false;
        group.userData.spark = false;
        group.userData.delete = false;
        group.userData.color = color;

        this.cubes.push(group);
        scene.add(group);
    },

    update() {
        for (let i = 0; i < this.cubes.length; i++) {
            const g = this.cubes[i];

            if (g.userData.hit && g.userData.health) this._hit(g);

            g.position.z += g.userData.positionZD * this.speed;
            g.userData.positionZD -= this.gravity * this.speed;

            if (!g.userData.hit) {
                g.position.x += g.userData.positionXD * this.speed;
                g.rotation.x += g.userData.rotateXD * this.speed;
                g.rotation.y += g.userData.rotateYD * this.speed;
                g.rotation.z += g.userData.rotateZD * this.speed;
            } else {
                g.children.forEach(child => {
                    child.position.x += child.userData.positionXD * this.speed;
                    child.position.y += child.userData.positionYD * this.speed;
                    child.position.z += child.userData.positionZD * this.speed;
                    child.rotation.x += child.userData.rotateXD * this.speed;
                    child.rotation.y += child.userData.rotateYD * this.speed;
                    child.rotation.z += child.userData.rotateZD * this.speed;
                });
            }

            if (!g.userData.delete && g.position.z > 150) {
                g.userData.delete = true;
                this._delete(g);
                this.cubes.splice(i, 1);
                i--;
            }
        }
    },

    _hit(target) {
        if (target.userData.spark) return;
        target.userData.spark = true;

        const sparkSpeed = 7 + Q.pointer.speedScaled * 0.125;

        if (Q.pointer.speedScaled > Q.minPointerSpeed) {
            target.userData.health--;
            Q.incrementScore(10);
            const hitX = Q.pointer.scene.x - Q.pointer.delta.x;
            const hitY = Q.pointer.scene.y - Q.pointer.delta.y;
            Q.sparkBurst(hitX, hitY, 16, sparkSpeed, target.userData.color);
            if (target.userData.health > 0) {
                Q.glueShedSparks(target);
            } else {
                Q.incrementCubeCount(1);
            }
        } else {
            target.userData.spark = false;
            target.userData.hit = false;
        }
    },

    // Fix: [...children] pour éviter la mutation du tableau pendant l'itération
    // Note: geometry et materials sont partagés — on ne les dispose pas ici
    _delete(cubeGroup) {
        [...cubeGroup.children].forEach(child => {
            cubeGroup.remove(child);
        });
        this.scene.remove(cubeGroup);
    },
};
