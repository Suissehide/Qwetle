/*!
 * Portfolio 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    var section = document.querySelector('.project');
    if (!section) return;

    var cube    = section.querySelector('.project__cube');
    var aside   = section.querySelector('.project__aside');
    var shots   = section.querySelectorAll('.project__shot');
    var texts   = section.querySelectorAll('.project__text');
    var counter    = section.querySelector('.project__counter-current');
    var counterBox = section.querySelector('.project__counter');

    // Fraction de la largeur de la boîte du SVG réellement peinte à droite.
    // Le fichier grand-cube-bleu.svg a une marge transparente sur son bord droit.
    var CUBE_PAINT_RATIO = 0.974;

    // Marge conservée entre la fin du texte et le bord peint du carré. Le carré
    // est un carré pivoté : son bord se rétrécit d'environ 80px entre le haut et
    // le bas de la section, et la colonne texte est centrée verticalement. Sans
    // cette marge, le bas du texte sortirait du navy.
    var CUBE_MARGIN = 90;

    // Où le bord peint doit s'arrêter : déduit de la largeur réelle du texte
    // plutôt que d'un pourcentage figé, sinon la valeur n'est juste qu'à la
    // taille de fenêtre où elle a été calibrée.
    function cubeTargetX() {
        var padRight = parseFloat(getComputedStyle(aside).paddingRight) || 0;
        return aside.offsetLeft + aside.offsetWidth - padRight + CUBE_MARGIN;
    }

    function cubeShift() {
        var paintedRight = cube.offsetLeft + cube.offsetWidth * CUBE_PAINT_RATIO;
        // Jamais de valeur positive : sur une fenêtre large et basse, le bord
        // peint peut déjà se trouver à gauche de la cible. Glisser vers la
        // droite y découvrirait le rose sous le texte clair de la colonne.
        return Math.min(0, cubeTargetX() - paintedRight);
    }

    var stack = section.querySelector('.project__stack');
    var label = document.querySelector('.cursor-label');

    var survolPossible = window.matchMedia('(hover: hover)').matches;
    var animationsOk   = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    if (label && stack && survolPossible) {

        gsap.set(label, { xPercent: -50, yPercent: -50, scale: 0.6 });

        var setX  = gsap.quickSetter(label, 'x', 'px');
        var setY  = gsap.quickSetter(label, 'y', 'px');
        var mouse = { x: 0, y: 0 };
        var pos   = { x: 0, y: 0 };

        gsap.ticker.add(function () {
            // 0.16 = fraction du chemin restant parcourue par image,
            // corrigée du framerate réel pour rester identique en 60 et 120 Hz.
            var amount = 1 - Math.pow(1 - 0.16, gsap.ticker.deltaRatio());
            pos.x += (mouse.x - pos.x) * amount;
            pos.y += (mouse.y - pos.y) * amount;
            setX(pos.x);
            setY(pos.y);
        });

        stack.addEventListener('mouseenter', function (e) {
            // On téléporte le label sous le curseur avant de l'afficher,
            // sinon il traverse l'écran depuis sa dernière position.
            mouse.x = pos.x = e.clientX;
            mouse.y = pos.y = e.clientY;
            setX(pos.x);
            setY(pos.y);
            gsap.to(label, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power3.out' });
        });

        stack.addEventListener('mousemove', function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        stack.addEventListener('mouseleave', function () {
            gsap.to(label, { autoAlpha: 0, scale: 0.6, duration: 0.25, ease: 'power3.in' });
        });
    }

    // Inclinaison 3D de la carte au survol.
    if (stack && survolPossible && animationsOk) {

        // Deux jeux de constantes : vif tant que la souris pilote, plus souple
        // au retour. Le retour est nettement plus amorti que dans la carte à
        // collectionner d'origine : avec son ressort très mou, une image de
        // cette taille oscillait plusieurs secondes après la sortie et son
        // échelle repassait sous 1, si bien qu'elle semblait rétrécir avant de
        // se reposer.
        var RESSORT_SURVOL = { raideur: 0.066, amorti: 0.25 };
        var RESSORT_RETOUR = { raideur: 0.045, amorti: 0.32 };

        // Diviseur de l'angle : plus il est grand, plus l'inclinaison est douce.
        // À 7, le coin le plus incliné atteint environ 7 degrés.
        var DOUCEUR = 7;
        var ECHELLE = 1.02;
        var PROFONDEUR = 900;

        var etat = {
            actuel:  { rx: 0, ry: 0, e: 1 },
            vitesse: { rx: 0, ry: 0, e: 0 },
            cible:   { rx: 0, ry: 0, e: 1 },
            raideur: RESSORT_SURVOL.raideur,
            amorti:  RESSORT_SURVOL.amorti,
            survole: false,
            enCours: false,
            reste:   0
        };

        function integrer() {
            var s = etat;
            s.vitesse.rx += (s.cible.rx - s.actuel.rx) * s.raideur;
            s.vitesse.ry += (s.cible.ry - s.actuel.ry) * s.raideur;
            s.vitesse.e  += (s.cible.e  - s.actuel.e)  * s.raideur;
            s.vitesse.rx *= 1 - s.amorti;
            s.vitesse.ry *= 1 - s.amorti;
            s.vitesse.e  *= 1 - s.amorti;
            s.actuel.rx += s.vitesse.rx;
            s.actuel.ry += s.vitesse.ry;
            s.actuel.e  += s.vitesse.e;
        }

        function repose() {
            var s = etat;
            return Math.abs(s.vitesse.rx) < 0.005 &&
                   Math.abs(s.vitesse.ry) < 0.005 &&
                   Math.abs(s.vitesse.e)  < 0.001 &&
                   Math.abs(s.actuel.rx - s.cible.rx) < 0.01 &&
                   Math.abs(s.actuel.ry - s.cible.ry) < 0.01 &&
                   Math.abs(s.actuel.e  - s.cible.e)  < 0.001;
        }

        function boucle() {
            var s = etat;

            // Pas fixes d'un soixantième de seconde : l'inclinaison se comporte
            // pareil en 60 et en 120 Hz. Le compteur de tours borne le rattrapage
            // après un onglet resté en arrière-plan.
            s.reste += gsap.ticker.deltaRatio();
            var tours = 0;
            while (s.reste >= 1 && tours < 8) {
                integrer();
                s.reste -= 1;
                tours++;
            }
            if (s.reste > 8) s.reste = 0;

            stack.style.transform =
                'perspective(' + PROFONDEUR + 'px)' +
                ' rotateY(' + s.actuel.ry.toFixed(3) + 'deg)' +
                ' rotateX(' + s.actuel.rx.toFixed(3) + 'deg)' +
                ' scale(' + s.actuel.e.toFixed(4) + ')';

            if (repose()) {
                gsap.ticker.remove(boucle);
                s.enCours = false;
                // Reposée à plat : on retire la transformation plutôt que de
                // laisser une matrice identité, qui créerait un contexte
                // d'empilement inutile.
                if (!s.survole) stack.style.transform = '';
            }
        }

        function relancer() {
            if (etat.enCours) return;
            etat.enCours = true;
            gsap.ticker.add(boucle);
        }

        stack.addEventListener('mousemove', function (e) {
            var r = stack.getBoundingClientRect();
            var cx = (100 / r.width)  * (e.clientX - r.left) - 50;
            var cy = (100 / r.height) * (e.clientY - r.top)  - 50;

            etat.survole = true;
            etat.raideur = RESSORT_SURVOL.raideur;
            etat.amorti  = RESSORT_SURVOL.amorti;
            etat.cible.ry = -(cx / DOUCEUR);
            etat.cible.rx = cy / DOUCEUR;
            etat.cible.e  = ECHELLE;
            relancer();
        });

        stack.addEventListener('mouseleave', function () {
            etat.survole = false;
            etat.raideur = RESSORT_RETOUR.raideur;
            etat.amorti  = RESSORT_RETOUR.amorti;
            etat.cible.rx = 0;
            etat.cible.ry = 0;
            etat.cible.e  = 1;
            relancer();
        });
    }

    ScrollTrigger.matchMedia({

        '(min-width: 900px) and (prefers-reduced-motion: no-preference)': function () {

            // Le carré se rabat pendant l'approche, pas pendant l'épinglage :
            // le mouvement démarre quand la section entre par le bas de l'écran
            // et se termine exactement quand elle atteint le haut — c'est-à-dire
            // au moment où l'épinglage commence et où le projet 1 est en place.
            // `fromTo` et non `to` : avec `to`, GSAP prend la valeur courante
            // comme point de départ et `invalidateOnRefresh` la relit. Un
            // recalcul survenant pendant le mouvement figerait alors un départ
            // déjà décalé, et le carré ne reviendrait plus à sa position de repos.
            gsap.fromTo(cube, { x: 0 }, {
                x: cubeShift,
                ease: 'none',
                // Sans ça, chaque `invalidateOnRefresh` re-rend l'état de départ
                // et fige le carré à x=0 alors que le scroll le veut ailleurs.
                // C'est ScrollTrigger qui doit piloter le rendu, pas le tween.
                immediateRender: false,
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'top top',
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });

            var tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=380%',
                    pin: true,
                    // Amorti plutôt que collé à la molette : l'animation rattrape
                    // le scroll en ~1s, ce qui lisse les transitions entre projets.
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });

            // État de départ, en écho au repli CSS du même media query :
            // GSAP a besoin de connaître ce point de départ pour scruber les fondus.
            gsap.set(texts, { autoAlpha: 0, y: 20 });
            gsap.set(texts[0], { autoAlpha: 1, y: 0 });

            // Les visuels ne glissent plus : le cadre est fixe et c'est le
            // shader qui fond une image dans la suivante. Les liens restent
            // empilés en surimpression, invisibles ; seul l'actif est visible,
            // donc cliquable et focusable. `autoAlpha` et non `opacity` :
            // les inactifs sortent aussi du parcours de tabulation.
            gsap.set(shots, { autoAlpha: 0 });
            gsap.set(shots[0], { autoAlpha: 1 });

            // 0 → 80 : N - 1 transitions se partageant les 80 unités de la
            // phase projets. Tout est déduit du DOM pour qu'ajouter un projet
            // ne demande aucune retouche ici — voir les points restés manuels,
            // listés dans style.css au-dessus de .project__stack-inner.
            var N = texts.length;
            var STEP = 80 / (N - 1);

            // Surface WebGL. Si elle n'est pas disponible (pas de contexte),
            // `gl` vaut null et le repli CSS reste à l'écran.
            // Les visuels sont lus sur les liens de la pile plutôt que listés
            // ici : ajouter un projet reste une affaire de balisage.
            var visuels = Array.prototype.map.call(shots, function (a) {
                return a.getAttribute('data-visuel');
            });

            var gl = QwetlePortfolioGL.init(section.querySelector('.project__gl'), {
                count: N,
                sources: visuels,
            });

            // Un index continu de 0 à N-1 : la partie entière choisit les deux
            // visuels, la décimale pilote la dissolution. Passer par un objet
            // intermédiaire garde le rejeu propre dans les deux sens du scrub.
            var vue = { i: 0 };

            if (gl) {
                tl.to(vue, {
                    i: N - 1,
                    ease: 'none',
                    duration: 80,
                    onUpdate: function () {
                        gl.setIndex(vue.i);
                    }
                }, 0);
            }

            for (var i = 0; i < N - 1; i++) {
                var at = i * STEP;

                // Bascule du lien actif à mi-transition : le clic et le focus
                // suivent le visuel affiché.
                tl.to(shots[i], {
                    autoAlpha: 0,
                    duration: STEP * 0.4
                }, at + STEP * 0.3);

                tl.fromTo(shots[i + 1], {
                    autoAlpha: 0
                }, {
                    autoAlpha: 1,
                    duration: STEP * 0.4
                }, at + STEP * 0.3);

                tl.to(texts[i], {
                    autoAlpha: 0,
                    y: -20,
                    ease: 'power1.in',
                    duration: STEP * 0.5
                }, at);

                tl.fromTo(texts[i + 1], {
                    autoAlpha: 0,
                    y: 20
                }, {
                    autoAlpha: 1,
                    y: 0,
                    ease: 'power1.out',
                    duration: STEP * 0.5
                }, at + STEP * 0.5);
            }

            // Repères de progression : un segment par projet, l'actif allongé.
            // Générés ici plutôt qu'écrits dans le balisage, pour qu'ajouter un
            // projet n'oblige à rien tenir à jour. Ils sont purement visuels —
            // le numéro à côté porte déjà l'information.
            var reperes = document.createElement('span');
            reperes.className = 'project__counter-steps';
            reperes.setAttribute('aria-hidden', 'true');
            for (var k = 0; k < N; k++) {
                reperes.appendChild(document.createElement('i'));
            }
            counterBox.appendChild(reperes);
            // État initial posé à la main : le onUpdate du tween ne se déclenche
            // qu'au premier changement, donc au repos aucun segment ne serait actif.
            reperes.children[0].className = 'is-active';

            // Compteur : un objet intermédiaire, pour que le scrub le rejoue
            // proprement dans les deux sens.
            var count = { value: 1 };
            var dernierAffiche = 1;

            tl.to(count, {
                value: N,
                ease: 'none',
                duration: 80,
                onUpdate: function () {
                    var n = Math.round(count.value);
                    if (n === dernierAffiche) return;
                    dernierAffiche = n;
                    counter.textContent = n < 10 ? '0' + n : String(n);
                    for (var j = 0; j < reperes.children.length; j++) {
                        reperes.children[j].className = (j === n - 1) ? 'is-active' : '';
                    }
                }
            }, 0);

            // 80 → 100 : temps mort, le dernier projet reste lisible avant que
            // l'épinglage ne se relâche. Le bouton « Voir tous les projets »
            // n'est plus animé : il est affiché en permanence.
            tl.to({}, { duration: 20 }, 80);

            // Nettoyage au passage sous le seuil : sans ça, les gsap.set() de départ
            // (textes et bouton masqués, carré et pile à leur position initiale)
            // laissent des styles inline qui grippent le repli CSS empilé.
            return function () {
                if (gl) gl.dispose();
                gsap.set(cube, { clearProps: 'all' });
                gsap.set(texts, { clearProps: 'all' });
                gsap.set(shots, { clearProps: 'all' });
                // clearProps ne sait pas restaurer du texte : sans ça, le
                // compteur resterait figé sur la valeur atteinte au scroll.
                counter.textContent = '01';
                // Les repères sont créés par cette branche : elle les reprend
                // en partant, sinon un aller-retour sous le seuil en empilerait
                // un jeu de plus à chaque fois.
                if (reperes.parentNode) reperes.parentNode.removeChild(reperes);
            };
        }

    });

}());
