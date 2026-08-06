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

    // Fraction de la largeur de la boîte du SVG réellement peinte à droite.
    // Le fichier grand-cube-bleu.svg a une marge transparente sur son bord droit.
    var CUBE_PAINT_RATIO = 0.974;

    // Part de la largeur de fenêtre que le carré doit encore couvrir en fin d'écartement.
    var CUBE_TARGET = 0.35;

    function cubeShift() {
        var paintedRight = cube.offsetLeft + cube.offsetWidth * CUBE_PAINT_RATIO;
        return CUBE_TARGET * window.innerWidth - paintedRight;
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

            // 70 → 100 : réservé à la tâche 4
            tl.to({}, { duration: 30 }, 70);
        }

    });

}());
