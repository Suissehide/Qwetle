/*!
 * Projects index 0.2.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    // La page porte deux listes — « Projets » et « Lab ». On les traite comme une
    // seule suite de lignes : le visuel suiveur n'a qu'une boîte.
    var rows = Array.prototype.slice.call(document.querySelectorAll('.work-list .work-row'));
    if (!rows.length) return;

    var survolPossible = window.matchMedia('(hover: hover)').matches;
    var animationsOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    /* ---------------------------------------------------------------------
       Visuel suiveur
       Une seule boîte fixe, garnie d'une image par ligne. Les images entrent
       dans le document dès le chargement : les demander au survol laisserait
       un cadre vide le temps du premier aller-retour réseau.

       Deux garde-fous contre le visuel qui restait affiché après un
       défilement à la molette :

       1. Les tweens s'écrasent (overwrite). Quand une ligne ne fait que
          passer sous le pointeur, l'entrée et la sortie tombent à 40 ms
          d'écart ; sans écrasement, le fondu de sortie (0,25 s) se terminait
          avant le fondu d'entrée (0,35 s), qui reprenait la main et laissait
          la boîte visible sur une page où plus rien n'est survolé. C'était
          le bug.
       2. À chaque défilement, on relit ce qui se trouve sous le pointeur.
          Certains navigateurs n'émettent pas d'événement souris quand la
          page défile sous un pointeur immobile (Lenis défile par programme
          à chaque image) : la boîte est remise d'accord avec la réalité
          sans attendre que la souris bouge.
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
        var souris = { x: -1, y: -1 };
        var pos = { x: 0, y: 0 };
        // Index de la ligne dont le visuel est affiché, -1 quand la boîte est
        // cachée. C'est la seule source de vérité pour l'état de la boîte.
        var ligneActive = -1;

        var liens = rows.map(function (row) {
            return row.querySelector('.work-row__link');
        });

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

        function montrer(i) {
            if (ligneActive === i) return;
            var apparition = ligneActive === -1;
            ligneActive = i;

            if (apparition) {
                // On téléporte la boîte sous le curseur avant de l'afficher,
                // sinon elle traverse l'écran depuis sa dernière position.
                pos.x = souris.x;
                pos.y = souris.y;
                setX(pos.x);
                setY(pos.y);
            }

            visuels.forEach(function (img, j) {
                gsap.to(img, { autoAlpha: j === i ? 1 : 0, duration: 0.25, overwrite: true });
            });

            gsap.to(boite, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
        }

        function cacher() {
            if (ligneActive === -1) return;
            ligneActive = -1;
            gsap.to(boite, { autoAlpha: 0, scale: 0.7, duration: 0.25, ease: 'power3.in', overwrite: true });
        }

        // Ce que le pointeur survole vraiment, d'après sa dernière position
        // connue. -1 si rien, ou si la souris n'est jamais entrée dans la page.
        function ligneSousPointeur() {
            if (souris.x < 0) return -1;
            var el = document.elementFromPoint(souris.x, souris.y);
            var lien = el && el.closest ? el.closest('.work-row__link') : null;
            return lien ? liens.indexOf(lien) : -1;
        }

        function synchroniser() {
            var i = ligneSousPointeur();
            if (i === -1) cacher();
            else montrer(i);
        }

        // Une seule relecture par image, même si plusieurs événements de
        // défilement arrivent entre deux rendus.
        var relectureDemandee = false;
        function planifierSynchro() {
            if (relectureDemandee) return;
            relectureDemandee = true;
            requestAnimationFrame(function () {
                relectureDemandee = false;
                synchroniser();
            });
        }

        document.addEventListener('mousemove', function (e) {
            souris.x = e.clientX;
            souris.y = e.clientY;
        }, { passive: true });

        document.documentElement.addEventListener('mouseleave', function () {
            souris.x = souris.y = -1;
            cacher();
        });

        liens.forEach(function (lien, i) {
            if (!lien) return;

            lien.addEventListener('mouseenter', function (e) {
                souris.x = e.clientX;
                souris.y = e.clientY;
                montrer(i);
            });

            lien.addEventListener('mouseleave', cacher);
        });

        // Lenis défile par programme : son événement est le plus fiable. Le
        // défilement natif reste écouté pour le tactile, le clavier et le cas
        // sans Lenis (mouvement réduit).
        if (window.lenis && typeof window.lenis.on === 'function') {
            window.lenis.on('scroll', planifierSynchro);
        }
        window.addEventListener('scroll', planifierSynchro, { passive: true });
    }

    if (!animationsOk || !window.gsap) return;

    /* ---------------------------------------------------------------------
       Entrée du hero et décor
       Le titre et le chapô montent au chargement. Les cubes dérivent en
       boucle sur des durées premières entre elles.
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

    if (!window.ScrollTrigger) return;

    /* ---------------------------------------------------------------------
       Liaisons au défilement
       Les décors des deux extrémités débordent sur les listes. Au fil du
       défilement, chaque carré de la palette remonte à sa propre vitesse et
       tourne : les plus rapides passent devant les lignes, les plus lents
       traînent derrière. Le carré bleu suit le mouvement, plus lentement.
       --------------------------------------------------------------------- */

    function derive(conteneur, options) {
        var chips = gsap.utils.toArray(conteneur + ' .work-chip');

        chips.forEach(function (chip) {
            var vitesse = parseFloat(chip.getAttribute('data-speed')) || 1;
            var inclinaison = parseFloat(chip.style.getPropertyValue('--tilt')) || 0;
            gsap.fromTo(chip, {
                y: options.depuis * vitesse,
                rotate: inclinaison,
            }, {
                // Le déplacement croît avec la vitesse : c'est l'écart entre
                // carrés qui donne la profondeur.
                y: options.vers * vitesse,
                rotate: inclinaison + 90 * (vitesse - 1),
                ease: 'none',
                scrollTrigger: {
                    trigger: options.trigger,
                    start: options.start,
                    end: options.end,
                    scrub: 1,
                },
            });
        });
    }

    // Hero : les carrés partent du repos et remontent pendant que le hero
    // sort de l'écran et que la première liste arrive.
    derive('.work-hero__decor', {
        trigger: '.work-hero',
        start: 'top top',
        end: 'bottom -60%',
        depuis: 0,
        vers: -220,
    });

    gsap.to('.work-hero .pj-square', {
        yPercent: -22,
        rotate: 6,
        ease: 'none',
        scrollTrigger: {
            trigger: '.work-hero',
            start: 'top top',
            end: 'bottom -60%',
            scrub: 1,
        },
    });

    // Appel : les carrés arrivent depuis le bas, encore sous la liste, et
    // remontent en dérivant pendant que le bloc prend l'écran.
    derive('.pj-cta__decor', {
        trigger: '.pj-cta',
        start: 'top bottom',
        end: 'bottom bottom',
        depuis: 160,
        vers: -120,
    });

    gsap.fromTo('.pj-cta .pj-square', { yPercent: 14, rotate: -4 }, {
        yPercent: -8,
        rotate: 3,
        ease: 'none',
        scrollTrigger: {
            trigger: '.pj-cta',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 1,
        },
    });

    /* ---------------------------------------------------------------------
       Révélations au défilement
       --------------------------------------------------------------------- */

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

}());
