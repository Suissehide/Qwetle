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

// Stub — glueShedSparks est appellé quand health > 0 après un hit (chemin non atteint avec health=1)
// La logique originale dépendait de cloneVertices/projectVertex jamais définis
Q.glueShedSparks = () => {};

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

    // Trail : trois lames tressées, découpé en tronçons continus (un touchBreak
    // sépare deux gestes et ne doit jamais être relié).
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.6;
    const points = Q.touchPoints;
    let start = 0;
    while (start < points.length) {
        if (points[start].touchBreak) { start++; continue; }
        let end = start;
        while (end + 1 < points.length && !points[end + 1].touchBreak) end++;
        if (end > start) _drawTrailRun(ctx, start, end);
        start = end + 1;
    }
};

// Tampons réutilisés d'une frame à l'autre — le dessin tourne à 60 fps.
const _prevPos = { x: 0, y: 0 };
const _curPos = { x: 0, y: 0 };
const _nextPos = { x: 0, y: 0 };

// Position de la lame k au point p : on s'écarte le long de la normale, donc la
// frange garde la même largeur quel que soit le sens du geste.
const _lamePos = (p, k, out) => {
    const spread = Q.lameSpread(p, k);
    out.x = p.x + p.nx * spread;
    out.y = p.y + p.ny * spread;
};

// Demi-largeur de la lame au point p. La vie du point dessine un fuseau : nul
// aux deux bouts, maximal au milieu du geste.
const _halfWidth = p =>
    Math.sin(p.life * Q.PI / Q.touchPointLife) * Q.touchTrailThickness * p.thickness / 2;

const _drawTrailRun = (ctx, start, end) => {
    const points = Q.touchPoints;

    // Normale à la trajectoire, prise sur les deux voisins pour qu'elle tourne
    // doucement plutôt que de casser à chaque point.
    for (let i = start; i <= end; i++) {
        const before = points[i > start ? i - 1 : i];
        const after = points[i < end ? i + 1 : i];
        const dx = after.x - before.x;
        const dy = after.y - before.y;
        const len = Math.hypot(dx, dy);
        points[i].nx = len > 0.001 ? -dy / len : 0;
        points[i].ny = len > 0.001 ? dx / len : 0;
    }

    // Les trois lames se rejoignent à la pointe avant : leur écart se referme sur
    // la tête du geste, sinon la lame s'achève sur trois pointes côte à côte.
    // Première passe : distance de chaque point à la tête.
    let fromHead = 0;
    points[end].tip = 0;
    for (let i = end - 1; i >= start; i--) {
        fromHead += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        points[i].tip = fromHead;
    }
    // Seconde passe : fromHead vaut désormais la longueur totale du geste, donc
    // la distance de refermeture s'en déduit.
    const converge = fromHead * Q.touchTrailTipRatio;
    for (let i = start; i < end; i++) {
        points[i].tip = converge > 0 ? Math.min(1, points[i].tip / converge) : 1;
    }

    // Un tronçon par point : il part du milieu du segment précédent, passe par
    // le point lui-même et rejoint le milieu du suivant. Chaque tronçon est une
    // surface fermée entre deux quadratiques décalées — tracer un trait épais
    // ferait déborder les bouts arrondis dès que l'épaisseur change, et le bord
    // de la lame se mettrait à perler.
    for (let i = start + 1; i <= end; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const next = points[i < end ? i + 1 : i];
        const atHead = i === start + 1;
        const atTail = i === end;

        const hPrev = _halfWidth(prev);
        const hCur = _halfWidth(cur);
        const hNext = _halfWidth(next);
        const hFrom = atHead ? hPrev : (hPrev + hCur) / 2;
        const hTo = atTail ? hCur : (hCur + hNext) / 2;
        if (hFrom <= 0 && hCur <= 0 && hTo <= 0) continue;

        // Normale aux deux extrémités : moyenne des points qu'elles séparent,
        // pour que deux tronçons voisins partagent exactement la même arête.
        let fromNx = atHead ? prev.nx : prev.nx + cur.nx;
        let fromNy = atHead ? prev.ny : prev.ny + cur.ny;
        let len = Math.hypot(fromNx, fromNy) || 1;
        fromNx /= len;
        fromNy /= len;
        let toNx = atTail ? cur.nx : cur.nx + next.nx;
        let toNy = atTail ? cur.ny : cur.ny + next.ny;
        len = Math.hypot(toNx, toNy) || 1;
        toNx /= len;
        toNy /= len;

        for (let k = 0; k < Q.cubeColor.length; k++) {
            _lamePos(prev, k, _prevPos);
            _lamePos(cur, k, _curPos);
            _lamePos(next, k, _nextPos);
            const fromX = atHead ? _prevPos.x : (_prevPos.x + _curPos.x) / 2;
            const fromY = atHead ? _prevPos.y : (_prevPos.y + _curPos.y) / 2;
            const toX = atTail ? _curPos.x : (_curPos.x + _nextPos.x) / 2;
            const toY = atTail ? _curPos.y : (_curPos.y + _nextPos.y) / 2;

            ctx.fillStyle = Q.cubeColor[k];
            ctx.strokeStyle = Q.cubeColor[k];
            ctx.beginPath();
            ctx.moveTo(fromX + fromNx * hFrom, fromY + fromNy * hFrom);
            ctx.quadraticCurveTo(
                _curPos.x + cur.nx * hCur, _curPos.y + cur.ny * hCur,
                toX + toNx * hTo, toY + toNy * hTo
            );
            ctx.lineTo(toX - toNx * hTo, toY - toNy * hTo);
            ctx.quadraticCurveTo(
                _curPos.x - cur.nx * hCur, _curPos.y - cur.ny * hCur,
                fromX - fromNx * hFrom, fromY - fromNy * hFrom
            );
            ctx.closePath();
            ctx.fill();
            // Le trait fin recouvre le liseré d'antialiasing entre deux tronçons.
            ctx.stroke();
        }
    }
};
