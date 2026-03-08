// js/game/interaction.js
Q.pointer = {
    isDown: false,
    screen: { x: 0, y: 0 },
    scene: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    deltaScaled: { x: 0, y: 0 },
    speed: 0,
    speedScaled: 0,
};

Q.touchPoints = [];

Q.mouse = new THREE.Vector2();

const _onMouseMove = event => {
    Q.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    Q.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
window.addEventListener('mousemove', _onMouseMove, false);

const _handlePointerDown = (x, y) => {
    if (!Q.pointer.isDown) {
        Q.pointer.isDown = true;
        Q.pointer.screen.x = x;
        Q.pointer.screen.y = y;
    }
};

const _handlePointerUp = () => {
    if (Q.pointer.isDown) {
        Q.pointer.isDown = false;
        Q.touchPoints.push({ touchBreak: true, life: Q.touchPointLife });
    }
};

const _handlePointerMove = (x, y) => {
    if (Q.pointer.isDown) {
        Q.pointer.screen.x = x;
        Q.pointer.screen.y = y;
    }
};

// Pointer events (navigateurs modernes)
if ('PointerEvent' in window) {
    const _canvas = document.getElementById('stageTrail');

    _canvas.addEventListener('pointerdown', e => {
        if (!e.isPrimary) return;
        const top = window.pageYOffset || document.documentElement.scrollTop;
        const left = window.pageXOffset || document.documentElement.scrollLeft;
        _handlePointerDown(e.clientX + left, e.clientY + top);
    });

    _canvas.addEventListener('pointerup', e => {
        if (e.isPrimary) _handlePointerUp();
    });

    _canvas.addEventListener('pointermove', e => {
        if (!e.isPrimary) return;
        const top = window.pageYOffset || document.documentElement.scrollTop;
        const left = window.pageXOffset || document.documentElement.scrollLeft;
        _handlePointerMove(e.clientX + left, e.clientY + top);
    });

    document.body.addEventListener('mouseleave', _handlePointerUp);
} else {
    // Fallback touch events (iOS)
    const _canvas = document.getElementById('stageTrail');
    let _activeTouchId = null;

    _canvas.addEventListener('touchstart', e => {
        if (Q.pointer.isDown) return;
        const touch = e.changedTouches[0];
        _activeTouchId = touch.identifier;
        _handlePointerDown(touch.clientX, touch.clientY);
    });

    _canvas.addEventListener('touchend', e => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === _activeTouchId) {
                _handlePointerUp();
                break;
            }
        }
    });

    _canvas.addEventListener('touchmove', e => {
        for (const touch of e.changedTouches) {
            if (touch.identifier === _activeTouchId) {
                _handlePointerMove(touch.clientX, touch.clientY);
                e.preventDefault();
                break;
            }
        }
    }, { passive: false });
}
