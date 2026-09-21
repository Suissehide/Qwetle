/*!
 * About 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 *
 * Page /about. L'accordéon de la méthode est branché en premier et hors de
 * toute condition de mouvement : c'est une commande, pas une animation, et
 * elle doit répondre même quand l'utilisateur a demandé moins de mouvement.
 */

(function () {

    var page = document.querySelector('.ab');
    if (!page) return;

    /* ---------------------------------------------------------------------
       Méthode — accordéon horizontal
       Une seule tranche ouverte à la fois. Au-dessus de 900px la tranche
       survolée ou reçue au clavier s'ouvre ; en dessous, la feuille de style
       les ouvre toutes et le bouton disparaît : on rétablit alors les
       attributs pour que ce qui est annoncé corresponde à ce qui est montré.
       --------------------------------------------------------------------- */

    (function () {

        var panneaux = Array.prototype.slice.call(page.querySelectorAll('.ab-acc__panel'));
        if (!panneaux.length) return;

        function ouvrir(cible) {
            panneaux.forEach(function (panneau) {
                var actif = panneau === cible;
                var bouton = panneau.querySelector('.ab-acc__trigger');
                panneau.classList.toggle('is-open', actif);
                if (bouton) bouton.setAttribute('aria-expanded', String(actif));
            });
        }

        panneaux.forEach(function (panneau) {
            var bouton = panneau.querySelector('.ab-acc__trigger');
            if (!bouton) return;

            // Le survol ouvre, le clic aussi : au doigt, il n'y a pas de survol,
            // et le clic reste le seul geste disponible.
            panneau.addEventListener('mouseenter', function () { ouvrir(panneau); });
            bouton.addEventListener('focus', function () { ouvrir(panneau); });
            bouton.addEventListener('click', function () { ouvrir(panneau); });
        });

        // Sous 900px toutes les tranches sont dépliées : on l'annonce.
        var large = window.matchMedia('(min-width: 900px)');

        function surSeuil(e) {
            if (e.matches) {
                ouvrir(panneaux[0]);
                return;
            }
            panneaux.forEach(function (panneau) {
                var bouton = panneau.querySelector('.ab-acc__trigger');
                if (bouton) bouton.setAttribute('aria-expanded', 'true');
            });
        }

        surSeuil(large);
        if (large.addEventListener) large.addEventListener('change', surSeuil);
        else large.addListener(surSeuil);
    }());

    if (!window.gsap || !window.ScrollTrigger) return;

    // Lu une fois, comme sur les pages projet : sous mouvement réduit, rien
    // ne bouge au-delà de l'accordéon branché plus haut.
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
        '.pg-head__title', '.pg-head__lead', '.ab-acc__panel', '.pj-card',
        '.ab-proof__head .pj-link', '.ab-proof__name', '.ab-proof__desc',
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
       Repères — le cube à deux faces
       Même quart de tour que la section Compétences de l'accueil, étalé sur
       la traversée de la section.
       --------------------------------------------------------------------- */

    var cube = page.querySelector('.ab-facts__cube');

    if (cube) {
        var back  = cube.querySelector('.skills__cube-face--back');
        var front = cube.querySelector('.skills__cube-face--front');

        gsap.set(front, { rotate: -12, yPercent: 14 });
        gsap.set(back,  { rotate: 16, yPercent: 22, scale: 0.88 });

        var tour = gsap.timeline({
            scrollTrigger: {
                trigger: '.ab-facts',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });

        tour.to(front, { rotate: 78, yPercent: -14, ease: 'none' }, 0);
        tour.to(back,  { rotate: -44, yPercent: -22, scale: 1.06, ease: 'none' }, 0);
    }

    /* ---------------------------------------------------------------------
       Preuve — les captures grandissent puis s'éteignent
       Chaque visuel entre à 86 % et atteint sa taille pleine au milieu de
       l'écran, puis s'assombrit en sortant par le haut : le regard n'a
       jamais qu'une image nette à la fois. Deux déclencheurs distincts,
       l'un sur l'échelle et l'autre sur l'opacité, pour qu'ils ne se
       disputent pas la même propriété.
       --------------------------------------------------------------------- */

    gsap.utils.toArray('.ab-proof__media').forEach(function (media) {

        gsap.fromTo(media, { scale: 0.86 }, {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: media,
                start: 'top 92%',
                end: 'top 42%',
                scrub: 0.6,
            },
        });

        gsap.fromTo(media, { opacity: 1 }, {
            opacity: 0.25,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
                trigger: media,
                start: 'bottom 45%',
                end: 'bottom 5%',
                scrub: true,
            },
        });
    });

    /* ---------------------------------------------------------------------
       Desktop seulement : la colonne de gauche reste en place
       Sous 900px la grille repasse en une colonne (CSS) : matchMedia retire
       l'épinglage en descendant sous le seuil, et le recrée au retour.
       --------------------------------------------------------------------- */

    ScrollTrigger.matchMedia({

        '(min-width: 900px)': function () {

            var head = page.querySelector('.ab-proof__head');
            var list = page.querySelector('.ab-proof__list');
            if (!head || !list) return;

            // `pinSpacing: false` : la grille tient déjà la hauteur, c'est la
            // colonne de droite qui la fixe.
            ScrollTrigger.create({
                trigger: head,
                start: 'top 110px',
                endTrigger: list,
                end: 'bottom bottom',
                pin: true,
                pinSpacing: false,
            });
        },

    });

}());
