// js/game/sparks.js
Q.sparks = [];
Q.sparkPool = [];

Q.addSpark = (x, y, xD, yD, color) => {
    const spark = Q.sparkPool.pop() || {};
    spark.x = x + xD * 0.5;
    spark.y = y + yD * 0.5;
    spark.xD = xD;
    spark.yD = yD;
    spark.life = Q.random(400, 500);
    spark.maxLife = spark.life;
    spark.color = color;
    Q.sparks.push(spark);
    return spark;
};

Q.sparkBurst = (x, y, count, maxSpeed, color) => {
    const angleInc = Q.TAU / count;
    for (let i = 0; i < count; i++) {
        const angle = i * angleInc + angleInc * Math.random();
        const speed = (1 - Math.random() ** 3) * maxSpeed;
        Q.addSpark(x, y, Math.sin(angle) * speed, Math.cos(angle) * speed, color);
    }
};

// Mise à jour des sparks — appelée dans la boucle RAF
// Optimisation: swap+pop au lieu de splice(i,1) → O(1) au lieu de O(n)
Q.updateSparks = simTime => {
    const simSpeed = simTime / 16.6667;
    for (let i = Q.sparks.length - 1; i >= 0; i--) {
        const spark = Q.sparks[i];
        spark.life -= simTime;
        if (spark.life <= 0) {
            Q.sparkPool.push(spark);
            Q.sparks[i] = Q.sparks[Q.sparks.length - 1];
            Q.sparks.pop();
            continue;
        }
        spark.x += spark.xD * simSpeed;
        spark.y += spark.yD * simSpeed;
        spark.yD += Q.gravity * simSpeed;
    }
};

// Dessin sparks + trail sur canvas 2D
Q.drawSparksAndTrail = ctx => {
    // Sparks
    ctx.lineWidth = Q.sparkThickness;
    ctx.beginPath();
    Q.sparks.forEach(spark => {
        ctx.strokeStyle = spark.color;
        ctx.moveTo(spark.x, spark.y);
        const scale = (spark.life / spark.maxLife) ** 0.5 * 1.5;
        ctx.lineTo(spark.x - spark.xD * scale, spark.y - spark.yD * scale);
    });
    ctx.stroke();

    // Trail (3 couches de couleur avec offsets)
    Q.cubeColor.forEach((color, k) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        const count = Q.touchPoints.length;
        for (let i = 1; i < count; i++) {
            const current = Q.touchPoints[i];
            const prev = Q.touchPoints[i - 1];
            if (current.touchBreak || prev.touchBreak) continue;
            const offset = Q.strokeOffset[k];
            const size = Math.sin((current.life * 180 / Q.touchPointLife) * Q.PI / 180) * Q.touchTrailThickness;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(prev.x + offset, prev.y + offset);
            ctx.lineTo(current.x + offset, current.y + offset);
            ctx.stroke();
            if (size > 0) {
                ctx.arc(current.x + offset, current.y + offset, size / 2, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }
    });
};
