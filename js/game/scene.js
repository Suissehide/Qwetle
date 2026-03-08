// js/game/scene.js
Q.scene = {};

Q.scene.init = () => {
    const canvasSlash = document.getElementById('stageCubeSlash');
    const canvasTrail = document.getElementById('stageTrail');

    const threeScene = new THREE.Scene();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasSlash,
        alpha: true,
        antialias: true,
        precision: 'mediump'
    });
    renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.sortObjects = true;

    // Camera orthographique
    const viewSize = deviceInfo.screenHeight();
    const camera = new THREE.OrthographicCamera(
        (-deviceInfo.screenRatio() * viewSize) / 2,
        (deviceInfo.screenRatio() * viewSize) / 2,
        viewSize / 2,
        -viewSize / 2,
        -1000, 1000
    );
    camera.position.set(0, 50, 0);
    camera.lookAt(threeScene.position);
    camera.zoom = 20;
    camera.updateProjectionMatrix();

    // Lumière ambiante
    threeScene.add(new THREE.HemisphereLight(0xB1E1FF, 0xF5ACBA, 0.8));

    // Lumière directionnelle avec ombres — mapSize réduit à 1024 (était 4096)
    const shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    shadowLight.position.set(0, 20, -5);
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.camera.left = -500;
    shadowLight.shadow.camera.bottom = -500;
    shadowLight.shadow.camera.right = 500;
    shadowLight.shadow.camera.top = 500;
    shadowLight.shadow.mapSize.width = 1024;
    shadowLight.shadow.mapSize.height = 1024;
    shadowLight.castShadow = true;
    shadowLight.shadow.radius = 8;
    threeScene.add(shadowLight);

    // Sol recevant les ombres
    const floor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(200, 200),
        new THREE.ShadowMaterial({ color: "#2F4157", opacity: 0.4 })
    );
    floor.position.y = -20;
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    threeScene.add(floor);

    // Canvas 2D pour le trail
    const ctx = canvasTrail.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let viewScale, width, height;

    // Resize unifié : met à jour caméra + renderer + canvas 2D en une seule fonction
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        viewScale = h / 1000;
        width = w / viewScale;
        height = h / viewScale;

        canvasTrail.width = w * dpr;
        canvasTrail.height = h * dpr;
        canvasTrail.style.width = w + 'px';
        canvasTrail.style.height = h + 'px';

        camera.left = (-deviceInfo.screenRatio() * viewSize) / 2;
        camera.right = (deviceInfo.screenRatio() * viewSize) / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(deviceInfo.screenWidth(), deviceInfo.screenHeight());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return {
        threeScene,
        renderer,
        camera,
        ctx,
        dpr,
        getViewScale: () => viewScale,
        getWidth: () => width,
        getHeight: () => height,
    };
};
