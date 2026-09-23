/*!
 * Expertise 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 *
 * Page /work. Comme sur /about, l'accordéon des questions est branché en
 * premier et hors de toute condition de mouvement : replier une réponse est
 * une commande, pas une animation.
 */

(function () {

    var page = document.querySelector('.xp');
    if (!page) return;

    /* ---------------------------------------------------------------------
       Questions fréquentes
       Une seule réponse ouverte à la fois : la liste reste courte à l'écran
       et on ne perd pas la question suivante en bas de page. La hauteur est
       animée en CSS par `grid-template-rows`, il n'y a donc rien à mesurer
       ici.
       --------------------------------------------------------------------- */

    (function () {

        var items = Array.prototype.slice.call(page.querySelectorAll('.xp-faq__item'));
        if (!items.length) return;

        items.forEach(function (item) {

            var bouton = item.querySelector('.xp-faq__q');
            var panneau = item.querySelector('.xp-faq__panel');
            if (!bouton || !panneau) return;

            bouton.addEventListener('click', function () {

                var ouvrir = !item.classList.contains('is-open');

                items.forEach(function (autre) {
                    var actif = autre === item && ouvrir;
                    var b = autre.querySelector('.xp-faq__q');
                    autre.classList.toggle('is-open', actif);
                    if (b) b.setAttribute('aria-expanded', String(actif));
                });

                // Les hauteurs de la page changent : ScrollTrigger doit relire
                // ses bornes, sinon les épinglages plus haut restent calés sur
                // l'ancienne hauteur.
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            });
        });
    }());

    /* ---------------------------------------------------------------------
       Noms des domaines
       Un clic amène le défilement à l'angle de la face. Ils ne sont
       affichés que sur le cube (voir pages.css).
       --------------------------------------------------------------------- */

    (function () {

        var cube = page.querySelector('.xp-cube');
        if (!cube) return;
        var faces = cube.querySelectorAll('.xp-face');

        Array.prototype.forEach.call(cube.querySelectorAll('.xp-cube__link'), function (lien) {
            lien.addEventListener('click', function () {
                var i = parseInt(lien.getAttribute('data-face'), 10) || 0;
                var suivi = cube.suiviCube;

                if (!suivi) return;
                var y = suivi.start + (suivi.end - suivi.start) * i / (faces.length - 1);
                if (window.lenis) window.lenis.scrollTo(y);
                else window.scrollTo({ top: y, behavior: 'smooth' });
            });
        });
    }());

    if (!window.gsap || !window.ScrollTrigger) return;

    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    /* ---------------------------------------------------------------------
       Entrée du hero et décor
       L'eyebrow est laissé à script.js, qui le révèle sur toutes les pages.
       --------------------------------------------------------------------- */

    gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.pg-hero__title', { y: 40, opacity: 0, duration: 0.9 })
        .from('.pg-hero__lead', { y: 24, opacity: 0, duration: 0.7 }, '-=0.55')
        .from('.pg-hero__actions .pj-btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.45');

    [11, 13, 17].forEach(function (duree, i) {
        gsap.to('.pg-hero__cube--' + (i + 1), {
            y: (i % 2 ? 1 : -1) * 26,
            duration: duree,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    });

    gsap.to('.pg-hero .pj-square', {
        yPercent: -16,
        rotate: 6,
        ease: 'none',
        scrollTrigger: {
            trigger: '.pg-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        },
    });

    /* ---------------------------------------------------------------------
       Révélations au défilement
       --------------------------------------------------------------------- */

    var blocs = [
        '.pg-head__title', '.pg-head__lead', '.xp-cube__nav li', '.xp-faq__item', '.pj-cta__title', '.pj-cta__text',
        '.pj-cta .pj-btn',
    ];

    gsap.utils.toArray(blocs).forEach(function (bloc) {
        gsap.from(bloc, {
            scrollTrigger: { trigger: bloc, start: 'top 88%' },
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
        });
    });

    /* ---------------------------------------------------------------------
       Desktop seulement : le cube et le déroulé horizontal. Sous 900px, les
       faces du cube se rangent en grille et le déroulé redevient une liste
       verticale (CSS) : matchMedia retire les déclencheurs en passant sous
       le seuil.
       --------------------------------------------------------------------- */

    ScrollTrigger.matchMedia({

        '(min-width: 900px)': function () {

            /* -------------------------------------------------------------
               Le cube des domaines
               La section est épinglée pendant trois hauteurs de fenêtre et
               le cube roule d'un quart de tour par domaine : à gauche, vers
               le haut, puis à gauche (ROULES, axes de Three.js, y vers le
               haut). Le défilement se cale sur la face la plus proche à
               l'arrêt. Un seul tween fait avancer la position de 0 à 3.

               Le cube est dessiné en WebGL : une boîte dont chaque sommet
               est ramené sur l'arrondi des arêtes, un charcoal uni éclairé
               par de vraies lumières, et le texte de chaque domaine peint
               sur la face où le roulement l'amène, à l'endroit. Sans WebGL,
               la section garde sa grille de cartes.
               ------------------------------------------------------------- */

            var cube = page.querySelector('.xp-cube');
            var scene3d = cube && cube.querySelector('.xp-cube__scene');
            var faces = cube ? Array.prototype.slice.call(cube.querySelectorAll('.xp-face')) : [];
            var liens = cube ? Array.prototype.slice.call(cube.querySelectorAll('.xp-cube__link')) : [];
            var ROULES = [['y', -90], ['x', -90], ['y', -90]];
            var BIAIS = [['x', 20], ['y', -18]];
            var RAYON = 0.14;
            var COULEUR = '#2F4157';
            var etatCube = { p: 0 };
            var suiviCube = null;
            var gl = null;

            var axe = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0) };
            var quart = function (r, t) {
                return new THREE.Quaternion().setFromAxisAngle(axe[r[0]], r[1] * t * Math.PI / 180);
            };

            // Boîte de côté 1 aux arêtes arrondies. La grille est serrée
            // dans la bande de l'arrondi (BORD segments) et lâche sur le plat
            // (PLAT segments) ; chaque sommet est ensuite ramené sur la
            // sphère de rayon RAYON centrée sur le cœur de la boîte. Les UV
            // sont recalculés sur la boîte à plat : le texte tient sur le
            // plat, l'arrondi ne montre que le fond de la texture.
            var boiteArrondie = function () {
                var BORD = 10, PLAT = 6, N = 2 * BORD + PLAT;
                var h = 0.5, c = h - RAYON;
                var geo = new THREE.BoxGeometry(1, 1, 1, N, N, N);
                var pos = geo.attributes.position;
                var uv = geo.attributes.uv;
                var nor = geo.attributes.normal;
                var place = function (x) {
                    var i = Math.round((x + h) * N);
                    if (i <= BORD) return -h + RAYON * i / BORD;
                    if (i >= N - BORD) return c + RAYON * (i - N + BORD) / BORD;
                    return -c + 2 * c * (i - BORD) / PLAT;
                };
                // Axes u et v de chaque face, dans l'ordre des groupes de
                // BoxGeometry : +x, -x, +y, -y, +z, -z.
                var REPERES = [
                    [[0, 0, -1], [0, 1, 0]], [[0, 0, 1], [0, 1, 0]],
                    [[1, 0, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1]],
                    [[1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0]],
                ];
                var p = new THREE.Vector3(), q = new THREE.Vector3(), n = new THREE.Vector3();
                // Un sommet sert à plusieurs triangles : il ne doit être
                // déplacé qu'une fois.
                var fait = new Uint8Array(pos.count);

                geo.groups.forEach(function (groupe, f) {
                    var U = REPERES[f][0], V = REPERES[f][1];
                    for (var k = groupe.start; k < groupe.start + groupe.count; k++) {
                        var i = geo.index.getX(k);
                        if (fait[i]) continue;
                        fait[i] = 1;
                        p.set(place(pos.getX(i)), place(pos.getY(i)), place(pos.getZ(i)));
                        uv.setXY(i,
                            (p.x * U[0] + p.y * U[1] + p.z * U[2] + h),
                            (p.x * V[0] + p.y * V[1] + p.z * V[2] + h));
                        q.set(
                            Math.max(-c, Math.min(c, p.x)),
                            Math.max(-c, Math.min(c, p.y)),
                            Math.max(-c, Math.min(c, p.z)));
                        n.subVectors(p, q);
                        if (n.lengthSq() < 1e-12) n.fromArray([U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]]);
                        n.normalize();
                        pos.setXYZ(i, q.x + n.x * RAYON, q.y + n.y * RAYON, q.z + n.z * RAYON);
                        nor.setXYZ(i, n.x, n.y, n.z);
                    }
                });
                return geo;
            };

            var coupe = function (ctx, texte, largeur) {
                var mots = texte.split(/\s+/), lignes = [], ligne = '';
                mots.forEach(function (mot) {
                    var essai = ligne ? ligne + ' ' + mot : mot;
                    if (ctx.measureText(essai).width > largeur && ligne) {
                        lignes.push(ligne);
                        ligne = mot;
                    } else {
                        ligne = essai;
                    }
                });
                if (ligne) lignes.push(ligne);
                return lignes;
            };

            // Le texte d'une face, peint sur une toile carrée. `angle` fait
            // tourner le dessin pour qu'il arrive à l'endroit.
            var peindreFace = function (face, angle) {
                var T = 1024, marge = T * (RAYON + 0.07);
                var toile = document.createElement('canvas');
                toile.width = toile.height = T;
                var ctx = toile.getContext('2d');
                ctx.fillStyle = COULEUR;
                ctx.fillRect(0, 0, T, T);
                ctx.translate(T / 2, T / 2);
                ctx.rotate(angle);
                ctx.translate(-T / 2, -T / 2);

                var largeur = T - 2 * marge, y = marge;

                ctx.save();
                ctx.translate(marge + 14, y + 14);
                ctx.rotate(14 * Math.PI / 180);
                ctx.fillStyle = '#E94767';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-14, -14, 28, 28, 7);
                else ctx.rect(-14, -14, 28, 28);
                ctx.fill();
                ctx.restore();
                y += 28 + 52;

                ctx.fillStyle = '#fffdf9';
                ctx.textBaseline = 'top';
                ctx.font = '76px "Staatliches Regular", sans-serif';
                coupe(ctx, face.querySelector('.xp-face__title').textContent, largeur).forEach(function (l) {
                    ctx.fillText(l, marge, y);
                    y += 80;
                });
                y += 26;

                ctx.fillStyle = 'rgba(255, 253, 249, 0.74)';
                ctx.font = '33px "Comfortaa Regular", sans-serif';
                coupe(ctx, face.querySelector('.xp-face__text').textContent.replace(/\s+/g, ' ').trim(), largeur).forEach(function (l) {
                    ctx.fillText(l, marge, y);
                    y += 56;
                });

                var texture = new THREE.CanvasTexture(toile);
                texture.anisotropy = 8;
                return texture;
            };

            var creerGl = function () {
                var rendu;
                try {
                    rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                } catch (e) {
                    return null;
                }
                rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                rendu.domElement.className = 'xp-cube__gl';
                rendu.domElement.setAttribute('aria-hidden', 'true');

                var monde = new THREE.Scene();
                var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
                camera.position.set(0, 0, 3.1);

                monde.add(new THREE.AmbientLight(0xffffff, 0.62));
                var cle = new THREE.DirectionalLight(0xffffff, 0.62);
                cle.position.set(-0.5, 0.9, 0.8);
                monde.add(cle);
                var rose = new THREE.DirectionalLight(0xF5ACBA, 0.35);
                rose.position.set(1, -0.4, -0.3);
                monde.add(rose);

                var materiaux = [];
                for (var f = 0; f < 6; f++) {
                    materiaux.push(new THREE.MeshStandardMaterial({ color: COULEUR, roughness: 0.62, metalness: 0 }));
                }
                var objet = new THREE.Mesh(boiteArrondie(), materiaux);
                monde.add(objet);

                // Chaque domaine va sur la face que le roulement amène
                // devant, dessiné à l'endroit : on remonte les rotations
                // pour trouver, dans le repère du cube, la normale et le haut
                // de cette face.
                var GROUPES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
                var REPERES = [
                    [[0, 0, -1], [0, 1, 0]], [[0, 0, 1], [0, 1, 0]],
                    [[1, 0, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1]],
                    [[1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0]],
                ];
                var poses = faces.map(function (face, k) {
                    var Q = new THREE.Quaternion();
                    for (var r = 0; r < k; r++) Q.premultiply(quart(ROULES[r], 1));
                    var inverse = Q.clone().invert();
                    var n = new THREE.Vector3(0, 0, 1).applyQuaternion(inverse);
                    var haut = new THREE.Vector3(0, 1, 0).applyQuaternion(inverse);
                    var g = GROUPES.findIndex(function (a) {
                        return Math.round(n.x) === a[0] && Math.round(n.y) === a[1] && Math.round(n.z) === a[2];
                    });
                    var U = new THREE.Vector3().fromArray(REPERES[g][0]);
                    var V = new THREE.Vector3().fromArray(REPERES[g][1]);
                    return { face: face, groupe: g, angle: Math.atan2(Math.round(haut.dot(U)), Math.round(haut.dot(V))) };
                });

                // Peint (ou repeint, une fois les polices chargées) le texte
                // des domaines sur leurs faces. Le shader reçoit un fondu :
                // à 1, la face redevient charcoal uni, sans texte vu de biais.
                var base = new THREE.Color(COULEUR);
                var habiller = function () {
                    poses.forEach(function (pose) {
                        var m = materiaux[pose.groupe];
                        if (m.map) m.map.dispose();
                        m.map = peindreFace(pose.face, pose.angle);
                        m.color.set(0xffffff);
                        if (!pose.fondu) {
                            pose.fondu = { value: 0 };
                            m.onBeforeCompile = function (shader) {
                                shader.uniforms.uFondu = pose.fondu;
                                shader.uniforms.uBase = { value: base };
                                shader.fragmentShader = 'uniform float uFondu;\nuniform vec3 uBase;\n' +
                                    shader.fragmentShader.replace('#include <map_fragment>',
                                        'vec4 texelColor = texture2D( map, vUv );\n' +
                                        'diffuseColor *= mix( texelColor, vec4( uBase, 1.0 ), uFondu );');
                            };
                        }
                        m.needsUpdate = true;
                    });
                };
                habiller();

                var taille = function () {
                    var w = scene3d.clientWidth, h = scene3d.clientHeight;
                    if (!w || !h) return;
                    rendu.setSize(w, h, false);
                    camera.aspect = w / h;
                    // Le cube garde la même taille apparente, quelle que soit
                    // la largeur de la scène : c'est la hauteur qui cadre.
                    camera.updateProjectionMatrix();
                };

                return {
                    rendu: rendu, monde: monde, camera: camera, objet: objet, taille: taille,
                    materiaux: materiaux, habiller: habiller, poses: poses,
                };
            };

            var peindreCube = function () {
                var p = etatCube.p;
                var Q = new THREE.Quaternion();
                for (var r = 0; r < ROULES.length; r++) {
                    Q.premultiply(quart(ROULES[r], Math.min(1, Math.max(0, p - r))));
                }
                BIAIS.slice().reverse().forEach(function (b) { Q.premultiply(quart(b, 1)); });
                gl.objet.quaternion.copy(Q);
                gl.poses.forEach(function (pose, i) {
                    pose.fondu.value = Math.min(1, Math.abs(p - i) * 1.6);
                });
                gl.rendu.render(gl.monde, gl.camera);

                var active = Math.round(p);
                liens.forEach(function (lien, i) {
                    lien.classList.toggle('is-active', i === active);
                });
            };

            var tourCube = null;

            if (cube && scene3d && faces.length && window.THREE) gl = creerGl();

            if (gl) {
                scene3d.appendChild(gl.rendu.domElement);
                cube.classList.add('is-3d');
                gl.taille();
                peindreCube();

                tourCube = gsap.to(etatCube, {
                    p: ROULES.length,
                    ease: 'none',
                    onUpdate: peindreCube,
                    scrollTrigger: {
                        trigger: cube,
                        start: 'top top',
                        end: function () { return '+=' + window.innerHeight * ROULES.length; },
                        pin: true,
                        scrub: 1,
                        snap: { snapTo: 1 / ROULES.length, duration: 0.5, ease: 'power2.inOut' },
                        invalidateOnRefresh: true,
                        onRefresh: function () { if (gl) { gl.taille(); peindreCube(); } },
                    },
                });
                suiviCube = tourCube.scrollTrigger;
                cube.suiviCube = suiviCube;

                // Les faces sont peintes tout de suite, puis repeintes quand
                // les polices de la page sont prêtes : sans ça, la toile
                // garderait une police système.
                if (document.fonts && document.fonts.load) {
                    var cible = gl;
                    Promise.all([
                        document.fonts.load('76px "Staatliches Regular"'),
                        document.fonts.load('33px "Comfortaa Regular"'),
                    ]).then(function () {
                        if (gl !== cible) return;
                        gl.habiller();
                        peindreCube();
                    });
                }
            }

            // Repassage sous le seuil : les faces redeviennent des cartes.
            var nettoyerCube = function () {
                if (!cube) return;
                cube.classList.remove('is-3d');
                cube.suiviCube = null;
                if (gl) {
                    gl.rendu.domElement.remove();
                    gl.objet.geometry.dispose();
                    gl.materiaux.forEach(function (m) {
                        if (m.map) m.map.dispose();
                        m.dispose();
                    });
                    gl.rendu.dispose();
                    gl = null;
                }
                liens.forEach(function (lien) { lien.classList.remove('is-active'); });
            };

            /* -------------------------------------------------------------
               Déroulé : la section est épinglée et la piste glisse vers la
               gauche au rythme de la molette. La course est exactement le
               débordement de la piste, relu à chaque recalcul : elle dépend
               de la largeur de fenêtre et de la taille du texte.
               ------------------------------------------------------------- */

            var section = page.querySelector('.xp-steps');
            var piste = page.querySelector('.xp-steps__track');
            var cadre = page.querySelector('.xp-steps__viewport');
            if (!section || !piste || !cadre) return nettoyerCube;

            // La classe ferme le cadre et cale la section sur la hauteur de la
            // fenêtre : sans elle, la piste reste parcourable à la main et la
            // section garde sa hauteur naturelle (voir pages.css).
            section.classList.add('is-pinned');

            var course = function () {
                return Math.max(0, piste.scrollWidth - cadre.clientWidth);
            };

            gsap.to(piste, {
                x: function () { return -course(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: '.xp-steps',
                    start: 'top top',
                    end: function () { return '+=' + course(); },
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                },
            });

            // Repassage sous le seuil : la piste redevient une colonne et doit
            // retrouver son cadre ouvert et sa position d'origine.
            return function () {
                section.classList.remove('is-pinned');
                gsap.set(piste, { x: 0 });
                nettoyerCube();
            };
        },

    });

}());
