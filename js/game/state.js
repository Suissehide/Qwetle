// js/game/state.js

// Enums (Symbols pour éviter les collisions)
Q.GAME_MODE_RANKED = Symbol('GAME_MODE_RANKED');
Q.GAME_MODE_CASUAL = Symbol('GAME_MODE_CASUAL');
Q.MENU_MAIN = Symbol('MENU_MAIN');
Q.MENU_PAUSE = Symbol('MENU_PAUSE');
Q.MENU_SCORE = Symbol('MENU_SCORE');

// État global
Q.state = {
    game: {
        mode: Q.GAME_MODE_RANKED,
        time: 0,
        score: 0,
        cubeCount: 0
    },
    menus: {
        active: null
    }
};

// Sélecteurs
Q.isInGame = () => !Q.state.menus.active;
Q.isMenuVisible = () => !!Q.state.menus.active;
Q.isCasualGame = () => Q.state.game.mode === Q.GAME_MODE_CASUAL;
Q.isPaused = () => Q.state.menus.active === Q.MENU_PAUSE;

// Actions score — appellent Q.renderScoreHud() défini dans hud.js (OK car appelé au runtime)
Q.setScore = score => {
    Q.state.game.score = score;
    Q.renderScoreHud();
};

Q.incrementScore = inc => {
    if (Q.isInGame()) {
        Q.state.game.score = Math.max(0, Q.state.game.score + inc);
        Q.renderScoreHud();
    }
};

Q.setCubeCount = count => {
    Q.state.game.cubeCount = count;
    Q.renderScoreHud();
};

Q.incrementCubeCount = inc => {
    if (Q.isInGame()) {
        Q.state.game.cubeCount += inc;
        Q.renderScoreHud();
    }
};
