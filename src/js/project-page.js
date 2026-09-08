/*!
 * Project page 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    var page = document.querySelector('.project-page');
    if (!page || !window.gsap || !window.ScrollTrigger) return;

    /* ---------------------------------------------------------------------
       Révélations au défilement
       Même grammaire que la section « À propos » de la page d'accueil : chaque
       bloc monte de quelques pixels en apparaissant, dans l'ordre de lecture.
       --------------------------------------------------------------------- */

    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    var blocs = ['.pj-h2', '.pj-prose p', '.pj-fact', '.pj-shot', '.pj-link', '.pj-next__link'];

    gsap.utils.toArray(blocs).forEach(function (bloc) {
        gsap.from(bloc, {
            scrollTrigger: { trigger: bloc, start: 'top 88%' },
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
        });
    });

}());
