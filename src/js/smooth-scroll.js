/*!
 * Smooth scroll 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 *
 * Défilement lissé sur tout le site, porté par Lenis (js/lenis.min.js). La
 * page garde son défilement natif : Lenis ne fait qu'amortir la molette, si
 * bien que les épinglages et les déclencheurs de ScrollTrigger continuent de
 * lire la vraie position. Chargé après GSAP, avant les scripts de page.
 */

(function () {

    if (!window.Lenis) return;

    // Pas d'amorti sous mouvement réduit : la molette doit répondre au pixel.
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    var lenis = new Lenis({
        // 0.09 : un peu plus d'inertie que le réglage par défaut, sans que la
        // page semble flotter. Même ordre de grandeur que le `scrub: 1` des
        // séquences GSAP, pour que les deux amortis se lisent comme un seul.
        lerp: 0.09,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        // Le tactile garde son défilement natif : l'inertie du système est
        // meilleure que tout ce qu'on peut recalculer en JS sur téléphone.
        smoothTouch: false,
        anchors: true,
    });

    // ScrollTrigger est prévenu à chaque image rendue par Lenis, et c'est le
    // ticker de GSAP qui cadence Lenis : une seule boucle pour les deux, en
    // phase. `lagSmoothing(0)` empêche GSAP de rattraper un onglet resté en
    // arrière-plan d'un coup, ce qui ferait sauter la page au retour.
    if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        // Les épinglages insèrent leurs espaceurs après la première mesure de
        // Lenis : on lui fait relire la hauteur de page à chaque recalcul de
        // ScrollTrigger, sinon sa butée basse reste celle d'avant et le bas de
        // page devient inaccessible à la molette.
        ScrollTrigger.addEventListener('refresh', function () {
            lenis.resize();
        });
        gsap.ticker.add(function (time) {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    } else {
        var boucle = function (time) {
            lenis.raf(time);
            requestAnimationFrame(boucle);
        };
        requestAnimationFrame(boucle);
    }

    window.lenis = lenis;

}());
