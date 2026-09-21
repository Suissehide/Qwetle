/*!
 * Projects index 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    // La page porte deux listes — « Projets » et « Lab ». On les traite comme une
    // seule suite de lignes : le visuel suiveur n'a qu'une boîte, et la
    // numérotation propre à chaque famille est déjà écrite dans le HTML.
    var rows = Array.prototype.slice.call(document.querySelectorAll('.work-list .work-row'));
    if (!rows.length) return;

    var survolPossible = window.matchMedia('(hover: hover)').matches;
    var animationsOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    /* ---------------------------------------------------------------------
       Visuel suiveur
       Une seule boîte fixe, garnie d'une image par ligne. Les images entrent
       dans le document dès le chargement : les demander au survol laisserait
       un cadre vide le temps du premier aller-retour réseau.
       --------------------------------------------------------------------- */

    if (survolPossible && window.gsap) {

        var boite = document.createElement('div');
        boite.className = 'work-cursor';
        boite.setAttribute('aria-hidden', 'true');

        var visuels = [];

        rows.forEach(function (row) {
            var img = document.createElement('img');
            img.src = row.getAttribute('data-thumb');
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            boite.appendChild(img);
            visuels.push(img);
        });

        document.body.appendChild(boite);

        gsap.set(boite, { xPercent: -50, yPercent: -50, scale: 0.7 });

        var setX = gsap.quickSetter(boite, 'x', 'px');
        var setY = gsap.quickSetter(boite, 'y', 'px');
        var souris = { x: 0, y: 0 };
        var pos = { x: 0, y: 0 };

        gsap.ticker.add(function () {
            // 0.16 = fraction du chemin restant parcourue par image, corrigée du
            // framerate réel pour rester identique en 60 et 120 Hz. Même réglage
            // que le label suiveur de la page d'accueil.
            var part = 1 - Math.pow(1 - 0.16, gsap.ticker.deltaRatio());
            pos.x += (souris.x - pos.x) * part;
            pos.y += (souris.y - pos.y) * part;
            setX(pos.x);
            setY(pos.y);
        });

        rows.forEach(function (row, i) {

            var lien = row.querySelector('.work-row__link');
            if (!lien) return;

            lien.addEventListener('mouseenter', function (e) {
                // On téléporte la boîte sous le curseur avant de l'afficher,
                // sinon elle traverse l'écran depuis sa dernière position.
                souris.x = pos.x = e.clientX;
                souris.y = pos.y = e.clientY;
                setX(pos.x);
                setY(pos.y);

                visuels.forEach(function (img, j) {
                    gsap.to(img, { autoAlpha: j === i ? 1 : 0, duration: 0.25 });
                });

                gsap.to(boite, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
            });

            lien.addEventListener('mousemove', function (e) {
                souris.x = e.clientX;
                souris.y = e.clientY;
            });

            lien.addEventListener('mouseleave', function () {
                gsap.to(boite, { autoAlpha: 0, scale: 0.7, duration: 0.25, ease: 'power3.in' });
            });
        });
    }

    if (!animationsOk || !window.gsap) return;

    /* ---------------------------------------------------------------------
       Entrée du hero et décor
       Le titre et le chapô montent au chargement. Les cubes dérivent en
       boucle sur des durées premières entre elles ; le carré bleu remonte et
       pivote pendant que le hero sort de l'écran.
       --------------------------------------------------------------------- */

    gsap.from('.work-hero__inner > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
    });

    [11, 13, 17].forEach(function (duree, i) {
        gsap.to('.work-hero__cube--' + (i + 1), {
            y: (i % 2 ? 1 : -1) * 26,
            duration: duree,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    });

    if (window.ScrollTrigger) {

        gsap.to('.work-hero .pj-square', {
            yPercent: -16,
            rotate: 6,
            ease: 'none',
            scrollTrigger: {
                trigger: '.work-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
        });

        /* -----------------------------------------------------------------
           Révélations au défilement
           ----------------------------------------------------------------- */

        gsap.utils.toArray('.work-group__head').forEach(function (head) {
            gsap.from(head.children, {
                scrollTrigger: { trigger: head, start: 'top 88%' },
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out',
            });
        });

        rows.forEach(function (row) {
            gsap.from(row, {
                scrollTrigger: { trigger: row, start: 'top 92%' },
                y: 24,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
            });
        });

        gsap.from('.pj-cta__title, .pj-cta__text, .pj-cta .pj-btn', {
            scrollTrigger: { trigger: '.pj-cta', start: 'top 80%' },
            y: 26,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
        });
    }

}());
