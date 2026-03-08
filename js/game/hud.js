// js/game/hud.js
Q.hud = {
    scoreNode: $('.score-lbl'),
    cubeCountNode: $('.cube-count-lbl'),
    slowmoNode: $('.slowmo'),
    slowmoBarNode: $('.slowmo__bar'),
};

Q.renderScoreHud = () => {
    if (Q.isCasualGame()) {
        Q.hud.scoreNode.hide();
        Q.hud.cubeCountNode.css('opacity', '1');
    } else {
        Q.hud.scoreNode.text(`SCORE: ${Q.state.game.score}`).show();
        Q.hud.cubeCountNode.css('opacity', '0.65');
    }
    Q.hud.cubeCountNode.text(`CUBES SMASHED: ${Q.state.game.cubeCount}`);
};

// Fix: était slowmoNode.style.opacity (crash sur objet jQuery) → .css() correct
Q.renderSlowmoStatus = percentRemaining => {
    Q.hud.slowmoNode.css('opacity', percentRemaining === 0 ? 0 : 1);
    Q.hud.slowmoBarNode.css('transform', `scaleX(${percentRemaining.toFixed(3)})`);
};

// Init HUD au chargement
Q.renderScoreHud();
