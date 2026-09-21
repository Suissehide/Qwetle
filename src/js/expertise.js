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
       Le jeu de cartes
       Les cartes arrivent en fondu, puis s'ouvrent pendant que le hero sort
       de l'écran : chacune pivote au-delà de sa position de repos (lue dans
       la variable --r posée en ligne) et descend sur la pile qui suit. Rien
       sous 600px, où la feuille de styles les range en grille.
       --------------------------------------------------------------------- */

    if (window.matchMedia('(min-width: 600px)').matches) {
        var cartes = gsap.utils.toArray('.xp-deck__card');

        gsap.from(cartes, {
            opacity: 0,
            scale: 0.9,
            duration: 0.9,
            stagger: 0.08,
            delay: 0.25,
            ease: 'power3.out',
        });

        cartes.forEach(function (carte, i) {
            var repos = parseFloat(carte.style.getPropertyValue('--r')) || 0;
            gsap.fromTo(carte,
                { rotate: repos, y: 0 },
                {
                    rotate: repos * 1.7,
                    y: 70 + i * 8,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.pg-hero',
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1,
                    },
                });
        });
    }

    /* ---------------------------------------------------------------------
       Révélations au défilement
       --------------------------------------------------------------------- */

    var blocs = [
        '.pg-head__title', '.pg-head__lead', '.xp-tools__head .pj-link',
        '.xp-family', '.xp-faq__item', '.pj-cta__title', '.pj-cta__text',
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

    // Les cartes de la pile s'annoncent par leur contenu, jamais par la carte
    // elle-même : c'est la carte que l'empilement transforme plus bas, et deux
    // tweens sur la même opacité se disputeraient l'élément. Même précaution
    // que la galerie des pages projet.
    gsap.utils.toArray('.xp-card').forEach(function (carte) {
        gsap.from(carte.children, {
            scrollTrigger: { trigger: carte, start: 'top 85%' },
            y: 32,
            opacity: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: 'power3.out',
        });
    });

    /* ---------------------------------------------------------------------
       Desktop seulement : pile de cartes, colonne épinglée, déroulé
       horizontal. Sous 900px, la pile cesse de coller, la colonne reprend le
       flux et le déroulé redevient une liste verticale (CSS) : matchMedia
       retire les déclencheurs en passant sous le seuil.
       --------------------------------------------------------------------- */

    ScrollTrigger.matchMedia({

        '(min-width: 900px)': function () {

            /* -------------------------------------------------------------
               Les quatre domaines, en pile
               Chaque carte, sauf la dernière, rétrécit et s'assombrit
               pendant que la suivante monte la recouvrir.
               ------------------------------------------------------------- */

            var cartes = gsap.utils.toArray('.xp-card');

            cartes.forEach(function (carte, i) {
                if (i === cartes.length - 1) return;
                gsap.to(carte, {
                    scale: 0.94,
                    opacity: 0.5,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: cartes[i + 1],
                        start: 'top bottom',
                        end: 'top 100px',
                        scrub: true,
                    },
                });
            });

            /* -------------------------------------------------------------
               Boîte à outils : le titre reste en place pendant que les
               familles défilent.
               ------------------------------------------------------------- */

            var head = page.querySelector('.xp-tools__head');
            var list = page.querySelector('.xp-tools__list');

            if (head && list) {
                ScrollTrigger.create({
                    trigger: head,
                    start: 'top 110px',
                    endTrigger: list,
                    end: 'bottom bottom',
                    pin: true,
                    pinSpacing: false,
                });
            }

            /* -------------------------------------------------------------
               Déroulé : la section est épinglée et la piste glisse vers la
               gauche au rythme de la molette. La course est exactement le
               débordement de la piste, relu à chaque recalcul : elle dépend
               de la largeur de fenêtre et de la taille du texte.
               ------------------------------------------------------------- */

            var section = page.querySelector('.xp-steps');
            var piste = page.querySelector('.xp-steps__track');
            var cadre = page.querySelector('.xp-steps__viewport');
            if (!section || !piste || !cadre) return;

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
            };
        },

    });

}());
