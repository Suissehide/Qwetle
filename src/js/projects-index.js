/*!
 * Projects index 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    var list = document.querySelector('.work-list');
    if (!list) return;

    var rows = Array.prototype.slice.call(list.querySelectorAll('.work-row'));

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

    /* ---------------------------------------------------------------------
       Cubes du hero
       Même dérive lente que sur la page d'accueil : c'est ce qui rattache ce
       haut de page à celui du site, et la seule animation qui tourne en boucle
       ici. Trois durées premières entre elles, pour qu'ils ne repassent jamais
       ensemble par la même position.
       --------------------------------------------------------------------- */

    if (animationsOk && window.gsap) {
        [11, 13, 17].forEach(function (duree, i) {
            gsap.to('.work-hero__cube--' + (i + 1), {
                y: (i % 2 ? 1 : -1) * 26,
                duration: duree,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        });
    }

    /* ---------------------------------------------------------------------
       Révélations au défilement
       --------------------------------------------------------------------- */

    if (animationsOk && window.gsap && window.ScrollTrigger) {

        rows.forEach(function (row) {
            gsap.from(row, {
                scrollTrigger: { trigger: row, start: 'top 92%' },
                y: 24,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
            });
        });

        gsap.from('.work-outro__title, .work-outro__btn', {
            scrollTrigger: { trigger: '.work-outro', start: 'top 85%' },
            y: 26,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
        });
    }

}());
