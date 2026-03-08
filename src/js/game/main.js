// js/game/main.js
(() => {
    const { threeScene, renderer, camera, ctx, dpr, getViewScale, getWidth, getHeight } = Q.scene.init();
    const raycaster = new THREE.Raycaster();

    let spawnTime = 0;
    let lastTimestamp = 0;

    Q.shuffle(Q.cubeColor);

    function render(timestamp) {
        let frameTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Borner le frameTime : min 0, max 68ms (~15fps)
        if (frameTime < 0) frameTime = 17;
        else if (frameTime > 68) frameTime = 68;

        const viewScale = getViewScale();
        const halfW = getWidth() / 2;
        const halfH = getHeight() / 2;

        // Synchroniser les coordonnées scène depuis l'écran
        Q.pointer.scene.x = Q.pointer.screen.x / viewScale - halfW;
        Q.pointer.scene.y = Q.pointer.screen.y / viewScale - halfH;

        const simSpeed = frameTime / 16.6667;
        const forceMultiplier = 1 / (simSpeed * 0.75 + 0.25);

        // Calculer les deltas du pointer
        Q.pointer.delta.x = 0;
        Q.pointer.delta.y = 0;
        Q.pointer.deltaScaled.x = 0;
        Q.pointer.deltaScaled.y = 0;

        const lastTouch = Q.touchPoints[Q.touchPoints.length - 1];
        if (Q.pointer.isDown && lastTouch && !lastTouch.touchBreak) {
            Q.pointer.delta.x = Q.pointer.scene.x - lastTouch.x;
            Q.pointer.delta.y = Q.pointer.scene.y - lastTouch.y;
            Q.pointer.deltaScaled.x = Q.pointer.delta.x * forceMultiplier;
            Q.pointer.deltaScaled.y = Q.pointer.delta.y * forceMultiplier;
        }
        Q.pointer.speed = Math.hypot(Q.pointer.delta.x, Q.pointer.delta.y);
        Q.pointer.speedScaled = Q.pointer.speed * forceMultiplier;

        // Vieillir les touchPoints
        Q.touchPoints.forEach(p => p.life -= frameTime);

        // Supprimer les expirés en une passe (splice O(n) une fois vs shift O(n) en boucle)
        let expired = 0;
        while (expired < Q.touchPoints.length && Q.touchPoints[expired].life <= 0) expired++;
        if (expired > 0) Q.touchPoints.splice(0, expired);

        // Enregistrer la position courante
        if (Q.pointer.isDown) {
            Q.touchPoints.push({
                x: Q.pointer.scene.x,
                y: Q.pointer.scene.y,
                life: Q.touchPointLife,
            });
        }

        // Spawn de cubes
        spawnTime -= frameTime;
        if (spawnTime <= 0) {
            spawnTime = Q.getSpawnDelay();
            Q.cubeSlashObject.create(threeScene);
        }

        // Détection de hit par raycaster
        raycaster.setFromCamera(Q.mouse, camera);
        const intersects = raycaster.intersectObjects(threeScene.children, true);
        if (intersects.length > 0 && Q.pointer.isDown) {
            const parent = intersects[0].object.parent;
            if (parent && parent.userData.hit === false) parent.callback();
        }

        // Mise à jour des sparks
        Q.updateSparks(frameTime);

        // Mise à jour des cubes
        Q.cubeSlashObject.update();

        // Dessin 2D (trail + sparks)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.scale(dpr * viewScale, dpr * viewScale);
        ctx.translate(halfW, halfH);
        Q.drawSparksAndTrail(ctx);
        ctx.restore();

        // Rendu Three.js
        renderer.render(threeScene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
