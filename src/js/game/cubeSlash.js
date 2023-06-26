// globalConfig.js
// ============================================================================
// ============================================================================

const canvasSlash = document.getElementById('stageCubeSlash');
const canvasTrail = document.getElementById('stageTrail');

// Timing multiplier for entire game engine.
let gameSpeed = 1;

// Colors
const cubeColor = ["#2F4157", "#E94767", "#EF8096"];

// Gameplay
const getSpawnDelay = () => {
    const spawnDelayMax = 1400;
    const spawnDelayMin = 550;
    const spawnDelay = spawnDelayMax - state.game.cubeCount * 3.1;
    return Math.max(spawnDelay, spawnDelayMin);
}

// Track pointer positions to show trail
const touchTrailColor = 'rgba(233, 71, 103, 1)';
const touchTrailThickness = 15;
const touchPointLife = 140;
const touchPoints = [];
const strokeOffset = [
    random(-1, 1) * 10,
    random(-1, 1) * 10,
    random(-1, 1) * 10,
];

const gravity = 0.3;
// Spark config
const sparkThickness = 2.0;
const airDragSpark = 0.2;

// Size of in-game targets. This affects rendered size and hit area.
const targetRadius = 20;
const targetHitRadius = 25;

let pointerDelta = { x: 0, y: 0 };
let pointerDeltaScaled = { x: 0, y: 0 };

let pointerIsDown = false;
// The last known position of the primary pointer in screen coordinates.`
let pointerScreen = { x: 0, y: 0 };
// Same as `pointerScreen`, but converted to scene coordinates in rAF.
let pointerScene = { x: 0, y: 0 };
// Minimum speed of pointer before "hits" are counted.
const minPointerSpeed = 30;
let pointerSpeed;
let pointerSpeedScaled;



// state.js
// ============================================================================
// ============================================================================

////////////////////
// Math Constants //
////////////////////

const PI = Math.PI;
const TAU = Math.PI * 2;
const ETA = Math.PI * 0.5;



////////////////////
// Random Helpers //
////////////////////

// Generates a random number between min (inclusive) and max (exclusive)
function random(a, b) {
    const alpha = Math.random();
    return a * (1.0 - alpha) + b * alpha;
}

// Generates a random integer between and possibly including min and max values
const randomInt = (min, max) => ((Math.random() * (max - min + 1)) | 0) + min;

// Returns a random element from an array
const pickOne = arr => arr[Math.random() * arr.length | 0];

const shuffle = array => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

///////////
// Enums //
///////////

// Game Modes
const GAME_MODE_RANKED = Symbol('GAME_MODE_RANKED');
const GAME_MODE_CASUAL = Symbol('GAME_MODE_CASUAL');

// Available Menus
const MENU_MAIN = Symbol('MENU_MAIN');
const MENU_PAUSE = Symbol('MENU_PAUSE');
const MENU_SCORE = Symbol('MENU_SCORE');



//////////////////
// Global State //
//////////////////

const state = {
    game: {
        mode: GAME_MODE_RANKED,
        // Run time of current game.
        time: 0,
        // Player score.
        score: 0,
        // Total number of cubes smashed in game.
        cubeCount: 0
    },
    menus: {
        // Set to `null` to hide all menus
        active: null
    }
};


////////////////////////////
// Global State Selectors //
////////////////////////////

const isInGame = () => !state.menus.active;
const isMenuVisible = () => !!state.menus.active;
const isCasualGame = () => state.game.mode === GAME_MODE_CASUAL;
const isPaused = () => state.menus.active === MENU_PAUSE;


/////////////////
// HUD ACTIONS //
/////////////////

function setScore(score) {
    state.game.score = score;
    renderScoreHud();
}

function incrementScore(inc) {
    if (isInGame()) {
        state.game.score += inc;
        if (state.game.score < 0) {
            state.game.score = 0;
        }
        renderScoreHud();
    }
}

function setCubeCount(count) {
    state.game.cubeCount = count;
    renderScoreHud();
}

function incrementCubeCount(inc) {
    if (isInGame()) {
        state.game.cubeCount += inc;
        renderScoreHud();
    }
}

///////////
// Score //
///////////
const scoreNode = $('.score-lbl');
const cubeCountNode = $('.cube-count-lbl');

function renderScoreHud() {
    if (isCasualGame()) {
        scoreNode.css('display', 'none');
        cubeCountNode.css('opacity', '1');
    } else {
        scoreNode.text(`SCORE: ${state.game.score}`);
        scoreNode.css('display', 'block');
        cubeCountNode.css('opacity', '0.65');
    }
    cubeCountNode.text(`CUBES SMASHED: ${state.game.cubeCount}`);
}

renderScoreHud();

////////////////////
// Slow-Mo Status //
////////////////////

const slowmoNode = $('.slowmo');
const slowmoBarNode = $('.slowmo__bar');

function renderSlowmoStatus(percentRemaining) {
    slowmoNode.style.opacity = percentRemaining === 0 ? 0 : 1;
    slowmoBarNode.style.transform = `scaleX(${percentRemaining.toFixed(3)})`;
}


// interaction.js
// ============================================================================
// ============================================================================

// Interaction
// -----------------------------

function handleCanvasPointerDown(x, y) {
    if (!pointerIsDown) {
        pointerIsDown = true;
        pointerScreen.x = x;
        pointerScreen.y = y;
        // On when menus are open, point down/up toggles an interactive mode.
        // We just need to rerender the menu system for it to respond.
        // if (isMenuVisible()) renderMenus();
    }
}

function handleCanvasPointerUp() {
    if (pointerIsDown) {
        pointerIsDown = false;
        touchPoints.push({
            touchBreak: true,
            life: touchPointLife
        });
        // On when menus are open, point down/up toggles an interactive mode.
        // We just need to rerender the menu system for it to respond.
        // if (isMenuVisible()) renderMenus();
    }
}

function handleCanvasPointerMove(x, y) {
    if (pointerIsDown) {
        pointerScreen.x = x;
        pointerScreen.y = y;
    }
}


// Use pointer events if available, otherwise fallback to touch events (for iOS).
if ('PointerEvent' in window) {
    canvasTrail.addEventListener('pointerdown', event => {
        let top = window.pageYOffset || document.documentElement.scrollTop;
        let left = window.pageXOffset || document.documentElement.scrollLeft;
        event.isPrimary && handleCanvasPointerDown(event.clientX + left, event.clientY + top);
    });

    canvasTrail.addEventListener('pointerup', event => {
        event.isPrimary && handleCanvasPointerUp();
    });

    canvasTrail.addEventListener('pointermove', event => {
        let top = window.pageYOffset || document.documentElement.scrollTop;
        let left = window.pageXOffset || document.documentElement.scrollLeft;
        event.isPrimary && handleCanvasPointerMove(event.clientX + left, event.clientY + top);
    });

    // We also need to know if the mouse leaves the page. For this game, it's best if that
    // cancels a swipe, so essentially acts as a "mouseup" event.
    document.body.addEventListener('mouseleave', handleCanvasPointerUp);
} else {
    let activeTouchId = null;
    canvasTrail.addEventListener('touchstart', event => {
        if (!pointerIsDown) {
            const touch = event.changedTouches[0];
            activeTouchId = touch.identifier;
            handleCanvasPointerDown(touch.clientX, touch.clientY);
        }
    });
    canvasTrail.addEventListener('touchend', event => {
        for (let touch of event.changedTouches) {
            if (touch.identifier === activeTouchId) {
                handleCanvasPointerUp();
                break;
            }
        }
    });
    canvasTrail.addEventListener('touchmove', event => {
        for (let touch of event.changedTouches) {
            if (touch.identifier === activeTouchId) {
                handleCanvasPointerMove(touch.clientX, touch.clientY);
                event.preventDefault();
                break;
            }
        }
    }, { passive: false });
}

const mouse = new THREE.Vector2();
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

// sparks.js
// ============================================================================
// ============================================================================

const sparks = [];
const sparkPool = [];

function addSpark(x, y, xD, yD, color) {
    const spark = sparkPool.pop() || {};

    spark.x = x + xD * 0.5;
    spark.y = y + yD * 0.5;
    spark.xD = xD;
    spark.yD = yD;
    spark.life = random(400, 500);
    spark.maxLife = spark.life;
    spark.color = color;

    sparks.push(spark);

    return spark;
}

// Spherical spark burst
function sparkBurst(x, y, count, maxSpeed, color) {
    const angleInc = TAU / count;
    for (let i = 0; i < count; i++) {
        const angle = i * angleInc + angleInc * Math.random();
        const speed = (1 - Math.random() ** 3) * maxSpeed;
        addSpark(
            x,
            y,
            Math.sin(angle) * speed,
            Math.cos(angle) * speed,
            color
        );
    }
}

// Make a target "leak" sparks from all vertices.
// This is used to create the effect of target glue "shedding".
let glueShedVertices;
function glueShedSparks(target) {
    if (!glueShedVertices) {
        glueShedVertices = cloneVertices(target.vertices);
    } else {
        copyVerticesTo(target.vertices, glueShedVertices);
    }

    glueShedVertices.forEach(v => {
        if (Math.random() < 0.4) {
            projectVertex(v);
            addSpark(
                v.x,
                v.y,
                random(-12, 12),
                random(-12, 12)
            );
        }
    });
}

function returnSpark(spark) {
    sparkPool.push(spark);
}

// Round cube object 
// ============================================================================
// ============================================================================
function getColorValue(color) {
    return parseInt(color.replace("#", "0x"), 16);
};

function createBoxWithRoundedEdges(width, height, depth, radius0, smoothness) {
    let shape = new THREE.Shape();
    let eps = 0.00001;
    let radius = radius0 - eps;
    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);

    const extrudeSettings = {
        steps: 1,
        depth: depth - radius0 * 2,
        bevelEnabled: true,
        bevelThickness: radius0,
        bevelSize: radius,
        bevelOffset: 0,
        bevelSegments: smoothness * 2,
        curveSegments: smoothness
    };

    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
}

const cubeSize = 1.5;
const cubeSlashObject = {
    scene: null,
    cubes: [],
    axisOptions: [['x', 'y'], ['y', 'z'], ['z', 'x']],

    geometry: createBoxWithRoundedEdges(cubeSize, cubeSize, cubeSize, cubeSize / 4, 15),
    speed: 0.04,
    targetHitRadius: 50,
    targetRadius: -20,
    spawnRadius: Math.min(200 * 0.8, 20),
    gravity: -3.5,

    create(scene) {
        this.scene = scene;
        const color = cubeColor[Math.floor(Math.random() * 3)];
        const group = new THREE.Group();
        const material = new THREE.MeshPhysicalMaterial({ color: getColorValue(color) });

        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                for (let k = 0; k < 3; ++k) {
                    let cube = new THREE.Mesh(this.geometry, material);

                    cube.castShadow = true;
                    cube.receiveShadow = false;

                    cube.userData.rotateXD = 0;
                    cube.userData.rotateYD = 0;
                    cube.userData.rotateZD = 0;
                    const spinSpeeds = [
                        Math.random() * 0.6,
                        Math.random() * 0.6
                    ];
                    const axes = pickOne(this.axisOptions);
                    spinSpeeds.forEach((spinSpeed, i) => {
                        switch (axes[i]) {
                            case 'x':
                                cube.userData.rotateXD = spinSpeed;
                                break;
                            case 'y':
                                cube.userData.rotateYD = spinSpeed;
                                break;
                            case 'z':
                                cube.userData.rotateZD = spinSpeed;
                                break;
                        }
                    });

                    cube.rotation.set(0, 0, 0);
                    let cubeOffset = cubeSize / 2.8;
                    cube.position.set(
                        (i - 1) * (cubeSize - cubeOffset),
                        (j - 1) * (cubeSize - cubeOffset),
                        (k - 1) * (cubeSize - cubeOffset)
                    );

                    cube.userData.positionXD = (i - 1) * randomInt(1, 4);
                    cube.userData.positionYD = (j - 1) * randomInt(1, 4);
                    cube.userData.positionZD = (k - 1) * randomInt(1, 4);

                    cube.castShadow = true;

                    group.add(cube);
                }
            }
        }

        group.position.x = ((Math.random() * this.spawnRadius) - (this.spawnRadius * 2));
        group.position.y = cubeSize;
        group.position.z = ((Math.random() * this.targetRadius) - this.targetRadius) + 70;

        group.userData.positionXD = Math.random() * (-group.position.x / 6) + 1;
        group.userData.positionZD = -25;

        group.userData.rotateXD = 0;
        group.userData.rotateYD = 0;
        group.userData.rotateZD = 0;
        const spinSpeeds = [
            Math.random() * 0.6,
            Math.random() * 0.6
        ];
        const axes = pickOne(this.axisOptions);
        spinSpeeds.forEach((spinSpeed, i) => {
            switch (axes[i]) {
                case 'x':
                    group.userData.rotateXD = spinSpeed;
                    break;
                case 'y':
                    group.userData.rotateYD = spinSpeed;
                    break;
                case 'z':
                    group.userData.rotateZD = spinSpeed;
                    break;
            }
        });

        group.callback = function () { this.userData.hit = true; };
        group.userData.health = 1;
        group.userData.wireframe = 0;
        group.userData.hit = false;
        group.userData.spark = false;
        group.userData.delete = false;
        group.userData.color = color;

        this.cubes.push(group);
        this.scene.add(group);
    },

    update() {
        for (let i = 0; i < this.cubes.length; i++) {
            let cubeGroup = this.cubes[i];

            if (cubeGroup.userData.hit && cubeGroup.userData.health) {
                this.hit(cubeGroup);
            }

            cubeGroup.position.z += cubeGroup.userData.positionZD * this.speed;
            cubeGroup.userData.positionZD -= this.gravity * this.speed;

            if (!cubeGroup.userData.hit) {
                cubeGroup.position.x += cubeGroup.userData.positionXD * this.speed;

                cubeGroup.rotation.x += cubeGroup.userData.rotateXD * this.speed;
                cubeGroup.rotation.y += cubeGroup.userData.rotateYD * this.speed;
                cubeGroup.rotation.x += cubeGroup.userData.rotateZD * this.speed;
            } else {
                for (let j = 0; j < cubeGroup.children.length; j++) {
                    let child = cubeGroup.children[j];

                    child.position.x += (child.userData.positionXD * this.speed);
                    child.position.y += (child.userData.positionYD * this.speed);
                    child.position.z += (child.userData.positionZD * this.speed);

                    child.rotation.x += child.userData.rotateXD * this.speed;
                    child.rotation.y += child.userData.rotateYD * this.speed;
                    child.rotation.z += child.userData.rotateZD * this.speed;
                }
            }

            if (!cubeGroup.userData.delete && cubeGroup.position.z > 150) {
                cubeGroup.userData.delete = true;
                this.delete(cubeGroup);
                this.cubes.splice(i, 1);
                continue;
            }
        }
    },

    hit(target) {
        // const hitTestCount = Math.ceil(pointerSpeed / targetRadius * 2);

        // for (let ii = 1; ii <= hitTestCount; ii++) {
        // const percent = 1 - (ii / hitTestCount);
        const hitX = pointerScene.x - pointerDelta.x;
        const hitY = pointerScene.y - pointerDelta.y;

        if (!target.userData.spark) {
            target.userData.spark = true;

            const sparkSpeed = 7 + pointerSpeedScaled * 0.125;

            if (pointerSpeedScaled > minPointerSpeed) {
                target.userData.health--;
                incrementScore(10);

                if (target.userData.health <= 0) {
                    incrementCubeCount(1);
                    sparkBurst(hitX, hitY, 16, sparkSpeed, target.userData.color);
                    if (target.userData.wireframe) {
                        // slowmoRemaining = slowmoDuration;
                        // spawnTime = 0;
                        // spawnExtra = 2;
                    }
                } else {
                    sparkBurst(hitX, hitY, 16, sparkSpeed, target.userData.color);
                    glueShedSparks(target);
                }
            } else {
                target.userData.spark = false;
                target.userData.hit = false;
            }
        }
        // }
    },

    delete(cubeGroup) {
        for (let i = 0; i < cubeGroup.children.length; i++) {
            cubeGroup.children[i].geometry.dispose();
            cubeGroup.children[i].material.dispose();
            cubeGroup.remove(cubeGroup.children[i]);
        }
        this.scene.remove(cubeGroup);
    }
};

/**
 * Draw
 */
function draw(ctx) {
    // 2D Sparks
    // ---------------
    ctx.lineWidth = sparkThickness;
    ctx.beginPath();
    sparks.forEach(spark => {
        ctx.strokeStyle = spark.color;
        ctx.moveTo(spark.x, spark.y);
        const scale = (spark.life / spark.maxLife) ** 0.5 * 1.5;
        ctx.lineTo(spark.x - spark.xD * scale, spark.y - spark.yD * scale);

    });
    ctx.stroke();


    // Touch Strokes
    // ---------------
    cubeColor.forEach((color, k) => {
        // ctx.strokeStyle = touchTrailColor;
        // ctx.fillStyle = touchTrailColor;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        const touchPointCount = touchPoints.length;
        for (let i = 1; i < touchPointCount; i++) {
            const current = touchPoints[i];
            const prev = touchPoints[i - 1];
            if (current.touchBreak || prev.touchBreak) {
                continue;
            }
            // i === touchPointCount - 1 ? ctx.lineCap = 'round' : ctx.lineCap = 'butt';

            // const scale = current.life / touchPointLife;
            // ctx.lineWidth = scale * touchTrailThickness;
            let offset = strokeOffset[k];
            let size = (Math.sin((current.life * 180 / touchPointLife) * PI / 180) * touchTrailThickness);

            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(prev.x + offset, prev.y + offset);
            ctx.lineTo(current.x + offset, current.y + offset);
            ctx.stroke();
            if (size > 0) ctx.arc(current.x + offset, current.y + offset, size / 2, 0, Math.PI * 2, true);
            ctx.fill();
        }
    })
}


/**
 * Setup scene 
 */
const setupCubeSlashScene = () => {
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color('white');

    // setup renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasSlash, alpha: true, antialias: true, precision: 'mediump' });
    renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.sortObjects = true;

    // setup camera
    const viewSize = deviceInfo.screenHeight();
    const camera = new THREE.OrthographicCamera((-deviceInfo.screenRatio() * viewSize) / 2, (deviceInfo.screenRatio() * viewSize) / 2, viewSize / 2, -viewSize / 2, -1000, 1000);
    camera.position.set(0, 50, 0);
    camera.rotation.set(0, 0, 0);
    camera.lookAt(scene.position);
    camera.zoom = 20;
    camera.updateProjectionMatrix();

    // light
    {
        const skyColor = 0xB1E1FF;
        const groundColor = 0xF5ACBA;
        const intensity = 0.8;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    {
        const shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
        shadowLight.position.set(0, 20, -5);
        // shadowLight.target.position.set(0, -15, 0);

        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;
        shadowLight.shadow.camera.left = -500;
        shadowLight.shadow.camera.bottom = -500;
        shadowLight.shadow.camera.right = 500;
        shadowLight.shadow.camera.top = 500;
        shadowLight.shadow.mapSize.width = 4096;
        shadowLight.shadow.mapSize.height = 4096

        shadowLight.castShadow = true;
        shadowLight.shadow.radius = 8;

        scene.add(shadowLight);
        // scene.add(shadowLight.target);
    }

    {
        const floor = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(200, 200),
            new THREE.ShadowMaterial({
                color: "#2F4157",
                opacity: 0.4
            })
        );
        floor.position.y = -20;
        floor.rotation.x = -0.5 * Math.PI;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    // setup objects
    // cubeSlashObject.create(scene);

    // on page resize
    window.addEventListener('resize', e => {
        camera.left = (-deviceInfo.screenRatio() * viewSize) / 2;
        camera.right = (deviceInfo.screenRatio() * viewSize) / 2, viewSize / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
    });

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    const ctx = canvasTrail.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let viewScale;
    let width, height;

    function handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        viewScale = h / 1000;
        width = w / viewScale;
        height = h / viewScale;
        canvasTrail.width = w * dpr;
        canvasTrail.height = h * dpr;
        canvasTrail.style.width = w + 'px';
        canvasTrail.style.height = h + 'px';
    }

    // Set initial size
    handleResize();
    // resize fullscreen canvas
    window.addEventListener('resize', handleResize);

    const raycaster = new THREE.Raycaster();
    pointerDelta = { x: 0, y: 0 };
    pointerDeltaScaled = { x: 0, y: 0 };

    let spawnTime = 0;
    let spawnExtra = 0;
    const spawnExtraDelay = 300;

    let lastTimestamp = 0;
    shuffle(cubeColor);

    //RENDER
    function render(timestamp) {
        let frameTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // make sure negative time isn't reported (first frame can be whacky)
        if (frameTime < 0) {
            frameTime = 17;
        }
        // - cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
        else if (frameTime > 68) {
            frameTime = 68;
        }

        const halfW = width / 2;
        const halfH = height / 2;

        pointerScene.x = pointerScreen.x / viewScale - halfW;
        pointerScene.y = pointerScreen.y / viewScale - halfH;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        const lag = frameTime / 16.6667;
        const simTime = gameSpeed * frameTime;
        const simSpeed = gameSpeed * lag;

        // Spawn targets
        spawnTime -= simTime;
        if (spawnTime <= 0) {
            if (spawnExtra > 0) {
                spawnExtra--;
                spawnTime = spawnExtraDelay;
            } else {
                spawnTime = getSpawnDelay();
            }
            cubeSlashObject.create(scene);
        }

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0 && pointerIsDown) {
            if (intersects[0].object.parent.userData.hit === false)
                intersects[0].object.parent.callback();
        }

        // Pointer Tracking
        // -------------------

        // Compute speed and x/y deltas.
        // There is also a "scaled" variant taking game speed into account. This serves two purposes:
        //  - Lag won't create large spikes in speed/deltas
        //  - In slow mo, speed is increased proportionately to match "reality". Without this boost,
        //    it feels like your actions are dampened in slow mo.
        const forceMultiplier = 1 / (simSpeed * 0.75 + 0.25);
        pointerDelta.x = 0;
        pointerDelta.y = 0;
        pointerDeltaScaled.x = 0;
        pointerDeltaScaled.y = 0;
        const lastPointer = touchPoints[touchPoints.length - 1];

        if (pointerIsDown && lastPointer && !lastPointer.touchBreak) {
            pointerDelta.x = (pointerScene.x - lastPointer.x);
            pointerDelta.y = (pointerScene.y - lastPointer.y);
            pointerDeltaScaled.x = pointerDelta.x * forceMultiplier;
            pointerDeltaScaled.y = pointerDelta.y * forceMultiplier;
        }
        pointerSpeed = Math.hypot(pointerDelta.x, pointerDelta.y);
        pointerSpeedScaled = pointerSpeed * forceMultiplier;

        while (touchPoints[0] && touchPoints[0].life <= 0) {
            touchPoints.shift();
        }

        // Track points for later calculations, including drawing trail.
        touchPoints.forEach(p => p.life -= simTime);

        if (pointerIsDown) {
            touchPoints.push({
                x: pointerScene.x,
                y: pointerScene.y,
                life: touchPointLife
            });
        }

        const simAirDragSpark = 1 - (airDragSpark * simSpeed);
        // 2D sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i];
            spark.life -= simTime;
            if (spark.life <= 0) {
                sparks.splice(i, 1);
                returnSpark(spark);
                continue;
            }
            spark.x += spark.xD * simSpeed;
            spark.y += spark.yD * simSpeed;
            // spark.xD *= simAirDragSpark;
            // spark.yD *= simAirDragSpark;
            spark.yD += gravity * simSpeed;
        }

        // update objects
        cubeSlashObject.update();

        // Auto clear canvas
        ctx.clearRect(0, 0, canvasTrail.width, canvasTrail.height);
        // Auto scale drawing for high res displays, and incorporate `viewScale`.
        // Also shift canvas so (0, 0) is the middle of the screen.
        // This just works with 3D perspective projection.
        const drawScale = dpr * viewScale;
        ctx.scale(drawScale, drawScale);
        ctx.translate(halfW, halfH);
        draw(ctx);

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // render scene 
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
};

// init 
setupCubeSlashScene();