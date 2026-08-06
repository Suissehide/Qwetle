/*!
 * Portfolio 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    var section = document.querySelector('.project');
    if (!section) return;

    var cube  = section.querySelector('.project__cube');
    var inner   = section.querySelector('.project__stack-inner');
    var texts   = section.querySelectorAll('.project__text');
    var counter = section.querySelector('.project__counter-current');
    var counterBox = section.querySelector('.project__counter');
    var outro      = section.querySelector('.project__outro');

    // Fraction de la largeur de la boîte du SVG réellement peinte à droite.
    // Le fichier grand-cube-bleu.svg a une marge transparente sur son bord droit.
    var CUBE_PAINT_RATIO = 0.974;

    // Part de la largeur de fenêtre que le carré doit encore couvrir en fin d'écartement.
    var CUBE_TARGET = 0.35;

    function cubeShift() {
        var paintedRight = cube.offsetLeft + cube.offsetWidth * CUBE_PAINT_RATIO;
        return CUBE_TARGET * window.innerWidth - paintedRight;
    }

    var stack = section.querySelector('.project__stack');
    var label = document.querySelector('.cursor-label');

    if (label && stack && window.matchMedia('(hover: hover)').matches) {

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

    ScrollTrigger.matchMedia({

        '(min-width: 900px) and (prefers-reduced-motion: no-preference)': function () {

            var tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=450%',
                    pin: true,
                    scrub: true,
                    invalidateOnRefresh: true
                }
            });

            // 0 → 10 : le carré s'écarte vers la gauche
            tl.to(cube, { x: cubeShift, ease: 'none', duration: 10 }, 0);

            // État de départ, en écho au repli CSS du même media query :
            // GSAP a besoin de connaître ce point de départ pour scruber les fondus.
            gsap.set(texts, { autoAlpha: 0, y: 20 });
            gsap.set(texts[0], { autoAlpha: 1, y: 0 });

            // 10 → 70 : trois transitions de 20 unités chacune
            var STEP = 20;

            for (var i = 0; i < 3; i++) {
                var at = 10 + i * STEP;

                tl.to(inner, {
                    yPercent: -25 * (i + 1),
                    ease: 'none',
                    duration: STEP
                }, at);

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

            // Compteur : un objet intermédiaire, pour que le scrub le rejoue
            // proprement dans les deux sens.
            var count = { value: 1 };

            tl.to(count, {
                value: 4,
                ease: 'none',
                duration: 60,
                onUpdate: function () {
                    var n = Math.round(count.value);
                    counter.textContent = n < 10 ? '0' + n : String(n);
                }
            }, 10);

            // État de départ, en écho au repli CSS du même media query :
            // GSAP a besoin de connaître ce point de départ pour scruber le bouton.
            gsap.set(outro, { autoAlpha: 0, y: 30 });

            // 70 → 85 : le dernier projet sort, le bouton entre
            tl.to([inner, texts[3], counterBox], {
                autoAlpha: 0,
                ease: 'power1.in',
                duration: 8
            }, 70);

            tl.to(outro, {
                autoAlpha: 1,
                y: 0,
                ease: 'power2.out',
                duration: 10
            }, 75);

            // 85 → 100 : temps mort, le bouton reste lisible avant le relâchement
            tl.to({}, { duration: 15 }, 85);

            // Nettoyage au passage sous le seuil : sans ça, les gsap.set() de départ
            // (textes et bouton masqués, carré et pile à leur position initiale)
            // laissent des styles inline qui grippent le repli CSS empilé.
            return function () {
                gsap.set([cube, inner, counterBox, outro], { clearProps: 'all' });
                gsap.set(texts, { clearProps: 'all' });
            };
        }

    });

}());
