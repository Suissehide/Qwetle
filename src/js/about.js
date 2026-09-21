/*!
 * About 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 *
 * Page /about. Tout ici est animation : sans GSAP ou sous mouvement réduit,
 * la page reste complète et lisible telle que la feuille de styles la pose.
 */

(function () {

    var page = document.querySelector('.ab');
    if (!page) return;

    if (!window.gsap || !window.ScrollTrigger) return;

    // Lu une fois, comme sur les pages projet : sous mouvement réduit, rien
    // ne bouge, la page reste telle que la feuille de styles la pose.
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    /* ---------------------------------------------------------------------
       Entrée du hero
       L'eyebrow est laissé de côté : script.js le révèle déjà, comme sur
       toutes les autres pages du site. Deux tweens sur la même opacité se
       disputeraient l'élément.
       --------------------------------------------------------------------- */

    gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.pg-hero__title', { y: 40, opacity: 0, duration: 0.9 })
        .from('.pg-hero__lead', { y: 24, opacity: 0, duration: 0.7 }, '-=0.55')
        .from('.pg-hero__actions .pj-btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.45');

    /* ---------------------------------------------------------------------
       Décor de marque
       Deux durées premières entre elles, pour que les cubes ne repassent
       jamais ensemble par la même position. Le carré bleu, lui, remonte et
       pivote pendant que le hero sort de l'écran.
       --------------------------------------------------------------------- */

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
       Le manifeste, mot à mot
       Même découpe que l'idée des pages projet : GSAP 3.7 n'embarque pas
       SplitText, on remplace donc le texte par autant de spans que de mots.
       `fromTo` rend l'état de départ dès le chargement, sinon le paragraphe
       s'afficherait plein avant de s'éteindre au premier défilement.
       --------------------------------------------------------------------- */

    var idee = page.querySelector('.ab-idea__text');

    if (idee) {
        var mots = idee.textContent.trim().split(/\s+/);
        idee.innerHTML = mots.map(function (mot) {
            return '<span class="pj-word">' + mot + '</span>';
        }).join(' ');

        gsap.fromTo(idee.querySelectorAll('.pj-word'), { opacity: 0.15 }, {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: {
                trigger: idee,
                start: 'top 78%',
                end: 'bottom 45%',
                scrub: 0.6,
            },
        });
    }

    /* ---------------------------------------------------------------------
       Révélations au défilement
       Même grammaire que le reste du site : chaque bloc monte de quelques
       pixels en apparaissant, dans l'ordre de lecture.
       --------------------------------------------------------------------- */

    var blocs = [
        '.pg-head__title', '.pg-head__lead', '.ab-step', '.pj-card',
        '.pj-cta__title', '.pj-cta__text', '.pj-cta .pj-btn',
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
       Méthode — le rail se remplit, l'étape sous les yeux s'allume
       Le trait rose grandit du haut vers le bas pendant la traversée de la
       liste ; chaque étape reçoit is-active tant qu'elle occupe le milieu de
       l'écran. Deux déclencheurs simples plutôt qu'une timeline : ils n'ont
       rien à se synchroniser.
       --------------------------------------------------------------------- */

    var rail = page.querySelector('.ab-path__fill');

    if (rail) {
        gsap.fromTo(rail, { scaleY: 0 }, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: '.ab-path',
                start: 'top 60%',
                end: 'bottom 60%',
                scrub: 0.5,
            },
        });
    }

    gsap.utils.toArray('.ab-step').forEach(function (etape) {
        ScrollTrigger.create({
            trigger: etape,
            start: 'top 60%',
            end: 'bottom 60%',
            toggleClass: { targets: etape, className: 'is-active' },
        });
    });

    /* ---------------------------------------------------------------------
       Repères — les cubes flous
       Ils descendent et pivotent doucement pendant la traversée de la
       section, à des vitesses différentes : c'est ce décalage qui donne de
       la profondeur, pas une ombre.
       --------------------------------------------------------------------- */

    var cubes = page.querySelectorAll('.ab-facts__cube');

    if (cubes.length) {
        var derive = gsap.timeline({
            scrollTrigger: {
                trigger: '.ab-facts',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });

        derive.fromTo(cubes[0], { y: -60, rotate: -8 }, { y: 120, rotate: 14, ease: 'none' }, 0);
        if (cubes[1]) derive.fromTo(cubes[1], { y: 40, rotate: 10 }, { y: -90, rotate: -24, ease: 'none' }, 0);
    }

}());
