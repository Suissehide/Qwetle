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

            // 10 → 100 : réservé aux tâches 3 et 4. Un tween vide tient la durée
            // totale à 100 unités tant que les autres ne sont pas écrits.
            tl.to({}, { duration: 90 }, 10);
        }

    });

}());
