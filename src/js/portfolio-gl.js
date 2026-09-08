/*!
 * Portfolio GL 0.0.1
 *
 * Surface WebGL des visuels de projets : un plan qui occupe le cadre et
 * fond une image dans la suivante avec aberration chromatique et
 * déplacement horizontal, tous deux au maximum au milieu de la transition.
 *
 * Le module ne sait rien du scroll. Il expose `setIndex(v)` où v est une
 * position continue entre 0 et N-1 : la partie entière choisit les deux
 * textures, la partie décimale pilote la transition. C'est portfolio.js qui
 * relie cette valeur à la timeline.
 *
 * Renvoie null si le WebGL n'est pas disponible — l'appelant garde alors
 * son repli CSS.
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

var QwetlePortfolioGL = (function () {

    var VERT = [
        'varying vec2 vUv;',
        'void main() {',
        '   vUv = uv;',
        '   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var FRAG = [
        'precision mediump float;',

        'uniform sampler2D uTexA;',
        'uniform sampler2D uTexB;',
        'uniform float uAspectA;',
        'uniform float uAspectB;',
        'uniform float uAspectFrame;',
        'uniform float uProgress;',
        'uniform float uSplit;',
        'uniform float uShift;',
        'uniform float uRadius;',
        'varying vec2 vUv;',

        // Distance signée à un rectangle aux coins arrondis, en espace UV
        // corrigé du rapport du cadre pour que le rayon reste circulaire.
        'float distanceCoinsArrondis(vec2 uv, float rayon) {',
        '   vec2 demi = vec2(uAspectFrame, 1.0) * 0.5;',
        '   vec2 p = (uv - 0.5) * vec2(uAspectFrame, 1.0);',
        '   vec2 d = abs(p) - demi + rayon;',
        '   return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - rayon;',
        '}',

        // Recadrage « cover » : on garde le rapport de l'image en rognant
        // l'excédent, comme background-size: cover.
        'vec2 couvrir(vec2 uv, float aspectImage) {',
        '   vec2 echelle = vec2(1.0);',
        '   if (aspectImage > uAspectFrame) {',
        '      echelle.x = uAspectFrame / aspectImage;',
        '   } else {',
        '      echelle.y = aspectImage / uAspectFrame;',
        '   }',
        '   return (uv - 0.5) * echelle + 0.5;',
        '}',

        // Bruit léger, pour que le déplacement ne soit pas une translation
        // uniforme mais ondule par bandes horizontales.
        'float bruit(float y) {',
        '   return sin(y * 42.0) * 0.5 + sin(y * 113.0) * 0.3 + sin(y * 7.0) * 0.2;',
        '}',

        'void main() {',
        // L'intensité culmine au milieu de la transition et retombe à zéro
        // aux deux extrémités : au repos, l'image est parfaitement nette.
        '   float pic = sin(uProgress * 3.14159265);',
        '   float dep = bruit(vUv.y) * uShift * pic;',

        '   vec2 uvA = couvrir(vUv, uAspectA);',
        '   vec2 uvB = couvrir(vUv, uAspectB);',
        '   uvA.x += dep;',
        '   uvB.x += dep;',

        '   float ecart = uSplit * pic;',

        // Chaque canal est échantillonné à un décalage différent : c'est ce
        // qui produit les franges rouge et cyan.
        '   vec4 a = vec4(',
        '      texture2D(uTexA, uvA + vec2(ecart, 0.0)).r,',
        '      texture2D(uTexA, uvA).g,',
        '      texture2D(uTexA, uvA - vec2(ecart, 0.0)).b,',
        '      1.0);',

        '   vec4 b = vec4(',
        '      texture2D(uTexB, uvB + vec2(ecart, 0.0)).r,',
        '      texture2D(uTexB, uvB).g,',
        '      texture2D(uTexB, uvB - vec2(ecart, 0.0)).b,',
        '      1.0);',

        '   vec4 couleur = mix(a, b, smoothstep(0.15, 0.85, uProgress));',

        // Coins arrondis dans le shader, avec un fondu d\'un pixel environ.
        // On ne s\'appuie pas sur le border-radius CSS : hors du rayon, l\'alpha
        // tombe vraiment à zéro, donc rien de la carte ne subsiste dans les coins.
        '   float d = distanceCoinsArrondis(vUv, uRadius);',
        '   float lissage = fwidth(d) * 0.5 + 0.0005;',
        '   couleur.a *= 1.0 - smoothstep(-lissage, lissage, d);',

        // Le rendu attend des couleurs prémultipliées : sans ça, le fondu des
        // coins virerait au sombre sur le liseré antialiasé.
        '   gl_FragColor = vec4(couleur.rgb * couleur.a, couleur.a);',
        '}'
    ].join('\n');

    // Dégradés de repli, tant que les vraies images de projets n'existent pas.
    // Ils reprennent volontairement les mêmes couleurs que les règles
    // .project__shot-media--1..4 de style.css, qui servent, elles, au repli
    // empilé sans WebGL. Quand les vrais visuels arriveront, les deux
    // pointeront sur les mêmes fichiers et ce doublon disparaîtra.
    var DEGRADES = [
        [['#E94767', 0], ['#F5ACBA', 1]],
        [['#2F4157', 0], ['#1a2735', 1]],
        [['#F5ACBA', 0], ['#e8d5da', 1]],
        [['#E94767', 0.1], ['#2F4157', 1]]
    ];

    function textureDeDegrade(arrets, largeur, hauteur, graine) {
        var cv = document.createElement('canvas');
        cv.width = largeur;
        cv.height = hauteur;
        var cx = cv.getContext('2d');

        // 135deg en CSS descend vers la droite : même diagonale ici.
        var g = cx.createLinearGradient(0, 0, largeur, hauteur);
        for (var i = 0; i < arrets.length; i++) {
            g.addColorStop(arrets[i][1], arrets[i][0]);
        }
        cx.fillStyle = g;
        cx.fillRect(0, 0, largeur, hauteur);

        // Motif de losanges, en écho aux cubes de la marque. Il n'est pas
        // décoratif seulement : le décalage de canaux du shader ne produit une
        // frange que sur des contours. Sur un dégradé lisse, la transition
        // ressemblerait à un simple fondu. Les vraies images de projets
        // apporteront ce détail d'elles-mêmes.
        var cote = 96;
        cx.save();
        cx.translate(largeur / 2, hauteur / 2);
        cx.rotate(Math.PI / 4);
        for (var y = -hauteur; y < hauteur; y += cote) {
            for (var x = -largeur; x < largeur; x += cote) {
                var n = Math.sin((x * 12.9898 + y * 78.233 + graine * 43.7) * 0.01);
                cx.fillStyle = n > 0
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(47, 65, 87, 0.10)';
                cx.fillRect(x + 6, y + 6, cote - 12, cote - 12);
            }
        }
        cx.restore();

        return cv;
    }

    function init(canvas, options) {

        if (!canvas || typeof THREE === 'undefined') return null;

        var opts = options || {};
        var nb = opts.count || DEGRADES.length;
        var renderer;

        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: true,
                precision: 'mediump'
            });
        } catch (e) {
            // Pas de contexte WebGL : l'appelant garde son repli CSS.
            return null;
        }

        renderer.setClearColor(0x000000, 0);

        var scene  = new THREE.Scene();
        // Caméra orthographique sur un plan de 1×1 : les UV couvrent
        // exactement le cadre, quelle que soit sa taille en pixels.
        var camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

        var textures = [];
        for (var i = 0; i < nb; i++) {
            var source = textureDeDegrade(DEGRADES[i % DEGRADES.length], 1024, 640, i);
            var tex = new THREE.CanvasTexture(source);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            textures.push({ map: tex, aspect: source.width / source.height });
        }

        var uniforms = {
            uTexA:        { value: textures[0].map },
            uTexB:        { value: textures[Math.min(1, nb - 1)].map },
            uAspectA:     { value: textures[0].aspect },
            uAspectB:     { value: textures[Math.min(1, nb - 1)].aspect },
            uAspectFrame: { value: 1 },
            uProgress:    { value: 0 },
            // Écart maximal entre canaux, en fraction de la largeur.
            uSplit:       { value: opts.split === undefined ? 0.012 : opts.split },
            // Amplitude maximale du déplacement horizontal, idem.
            uShift:       { value: opts.shift === undefined ? 0.018 : opts.shift },
            // Rayon des coins, en fraction de la hauteur du cadre. Recalculé
            // au redimensionnement pour rester égal au rayon en pixels voulu.
            uRadius:      { value: 0 }
        };

        // Rayon en pixels, aligné sur le border-radius de .project__gl.
        var RAYON_PX = opts.radius === undefined ? 24 : opts.radius;

        var mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(1, 1),
            new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                // fwidth() : dérivées d'écran, à activer explicitement en WebGL 1.
                extensions: { derivatives: true }
            })
        );
        scene.add(mesh);

        var sale = true;

        function resize() {
            var l = canvas.clientWidth;
            var h = canvas.clientHeight;
            if (!l || !h) return;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(l, h, false);
            uniforms.uAspectFrame.value = l / h;
            uniforms.uRadius.value = RAYON_PX / h;
            sale = true;
        }

        var indexCourant = 0;

        function setIndex(v) {
            var borne = Math.max(0, Math.min(nb - 1 - 0.0001, v));
            indexCourant = borne;
            var a = Math.floor(borne);
            var b = Math.min(a + 1, nb - 1);
            uniforms.uTexA.value    = textures[a].map;
            uniforms.uTexB.value    = textures[b].map;
            uniforms.uAspectA.value = textures[a].aspect;
            uniforms.uAspectB.value = textures[b].aspect;
            uniforms.uProgress.value = borne - a;
            sale = true;
        }

        function render() {
            if (!sale) return;
            renderer.render(scene, camera);
            sale = false;
        }

        function dispose() {
            gsap.ticker.remove(render);
            window.removeEventListener('resize', resize);
            for (var i = 0; i < textures.length; i++) textures[i].map.dispose();
            mesh.geometry.dispose();
            mesh.material.dispose();
            renderer.dispose();
        }

        // Vrais visuels de projets, quand l'appelant en fournit. Les dégradés
        // construits plus haut restent affichés tant que le fichier n'est pas
        // arrivé : c'est eux le repli au chargement, pas un cadre vide. Un
        // fichier manquant laisse simplement son dégradé en place.
        var chargeur = (opts.sources && opts.sources.length) ? new THREE.TextureLoader() : null;

        (opts.sources || []).forEach(function (url, i) {
            if (i >= nb || !url) return;
            chargeur.load(url, function (tex) {
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;

                var ancienne = textures[i].map;
                textures[i] = { map: tex, aspect: tex.image.width / tex.image.height };

                // Les uniformes pointent peut-être déjà sur la texture
                // remplacée : on les recale sur la vue courante avant de
                // libérer l'ancienne, sinon le rendu suivant échantillonnerait
                // une texture disposée.
                setIndex(indexCourant);
                ancienne.dispose();
            });
        });

        resize();
        setIndex(0);
        window.addEventListener('resize', resize);
        // On ne redessine que lorsqu'un uniform a changé : au repos, le
        // ticker ne coûte rien de plus qu'un test booléen.
        gsap.ticker.add(render);

        return { setIndex: setIndex, resize: resize, dispose: dispose };
    }

    return { init: init };

}());
