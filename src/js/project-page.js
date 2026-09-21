/*!
 * Project page 0.1.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

(function () {

    var page = document.querySelector('.project-page');
    if (!page || !window.gsap || !window.ScrollTrigger) return;

    // Lu une fois, comme sur l'accueil. Sous mouvement réduit, rien ne bouge :
    // le bandeau de points clés est lui aussi arrêté, côté CSS.
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    /* ---------------------------------------------------------------------
       Entrée du hero
       Une seule timeline au chargement : le titre, l'accroche et les boutons
       montent dans l'ordre de lecture, la capture arrive de plus bas et un
       peu plus petite, la barre méta se pose en dernier.
       --------------------------------------------------------------------- */

    var hero = gsap.timeline({ defaults: { ease: 'power3.out' } });

    hero.from('.pj-back, .pj-kicker', { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 })
        .from('.pj-title', { y: 44, opacity: 0, duration: 0.9 }, '-=0.3')
        .from('.pj-tagline', { y: 24, opacity: 0, duration: 0.7 }, '-=0.55')
        .from('.pj-hero__actions .pj-btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.45')
        .from('.pj-cover', { y: 70, opacity: 0, scale: 0.92, duration: 1.1, ease: 'power4.out' }, '-=0.9')
        .from('.pj-meta > div', { y: 18, opacity: 0, duration: 0.6, stagger: 0.07 }, '-=0.6');

    /* ---------------------------------------------------------------------
       Cubes flous et carré bleu
       Même dérive lente que sur l'accueil et sur l'index : deux durées
       premières entre elles, pour qu'ils ne repassent jamais ensemble par la
       même position. Le carré, lui, suit le défilement : il remonte et
       pivote un peu pendant que le hero sort de l'écran.
       --------------------------------------------------------------------- */

    [13, 17].forEach(function (duree, i) {
        gsap.to('.pj-hero__cube--' + (i + 1), {
            y: (i % 2 ? 1 : -1) * 26,
            duration: duree,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    });

    gsap.to('.pj-hero .pj-square', {
        yPercent: -16,
        rotate: 6,
        ease: 'none',
        scrollTrigger: {
            trigger: '.pj-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        },
    });

    // La capture s'efface doucement en quittant l'écran par le haut : le
    // regard est déjà sur le bandeau et l'idée, elle n'a plus à retenir.
    // `fromTo` avec un départ explicite, et pas `to` : au chargement, la
    // capture est encore à 0 d'opacité (entrée du hero ci-dessus), et un `to`
    // relirait cette valeur comme point de départ — la capture s'éteindrait
    // dès le premier défilement. `immediateRender: false` pour ne pas écraser
    // l'entrée en cours avec ce point de départ.
    gsap.fromTo('.pj-cover', { yPercent: 0, opacity: 1 }, {
        yPercent: -6,
        opacity: 0.4,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
            trigger: '.pj-cover',
            start: 'bottom 70%',
            end: 'bottom 5%',
            scrub: true,
        },
    });

    /* ---------------------------------------------------------------------
       L'idée, mot à mot
       Le paragraphe est découpé en mots (GSAP 3.7 n'embarque pas SplitText),
       chaque mot part à 15 % d'opacité et rejoint 100 % dans l'ordre, au fil
       du défilement. `fromTo` rend l'état de départ dès le chargement : pas
       de paragraphe plein qui s'éteindrait au premier scroll.
       --------------------------------------------------------------------- */

    var idee = page.querySelector('.pj-idea__text');

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
                end: 'bottom 42%',
                scrub: 0.6,
            },
        });
    }

    /* ---------------------------------------------------------------------
       Points clés
       Les cartes montent l'une après l'autre. Le cube à deux faces fait son
       quart de tour pendant toute la traversée de la section, comme celui
       de la section Compétences de l'accueil.
       --------------------------------------------------------------------- */

    gsap.from('.pj-card', {
        scrollTrigger: { trigger: '.pj-bento', start: 'top 82%' },
        y: 44,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
    });

    var cube = page.querySelector('.pj-keys__cube');

    if (cube) {
        var back  = cube.querySelector('.skills__cube-face--back');
        var front = cube.querySelector('.skills__cube-face--front');

        gsap.set(front, { rotate: -12, yPercent: 14 });
        gsap.set(back,  { rotate: 16, yPercent: 22, scale: 0.88 });

        var tour = gsap.timeline({
            scrollTrigger: {
                trigger: '.pj-keys',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });

        tour.to(front, { rotate: 78, yPercent: -14, ease: 'none' }, 0);
        tour.to(back,  { rotate: -44, yPercent: -22, scale: 1.06, ease: 'none' }, 0);
    }

    /* ---------------------------------------------------------------------
       Révélations au défilement
       Même grammaire que l'accueil : chaque bloc monte de quelques pixels
       en apparaissant, dans l'ordre de lecture. La galerie révèle le cadre
       et non la figure : c'est la figure que l'empilement transforme plus
       bas, et deux tweens sur la même opacité se disputeraient l'élément.
       --------------------------------------------------------------------- */

    var blocs = [
        '.pj-h2', '.pj-shot__frame', '.pj-gains__lead', '.pj-gains__head .pj-link',
        '.pj-gain', '.pj-next__link', '.pj-cta__title', '.pj-cta__text', '.pj-cta .pj-btn',
    ];

    gsap.utils.toArray(blocs).forEach(function (bloc) {
        gsap.from(bloc, {
            scrollTrigger: { trigger: bloc, start: 'top 88%' },
            y: 28,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
        });
    });

    /* ---------------------------------------------------------------------
       Desktop seulement : galerie empilée et colonne épinglée
       Sous 900px la galerie ne colle plus (CSS) et la colonne des bénéfices
       reprend le flux : matchMedia retire les déclencheurs en passant sous
       le seuil, et les recrée au retour.
       --------------------------------------------------------------------- */

    ScrollTrigger.matchMedia({

        '(min-width: 900px)': function () {

            // Chaque capture, sauf la dernière, rétrécit et s'assombrit
            // pendant que la suivante monte la recouvrir.
            var shots = gsap.utils.toArray('.pj-shot');

            shots.forEach(function (shot, i) {
                if (i === shots.length - 1) return;
                gsap.to(shot, {
                    scale: 0.92,
                    opacity: 0.45,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: shots[i + 1],
                        start: 'top bottom',
                        end: 'top 100px',
                        scrub: true,
                    },
                });
            });

            // Le titre et le chapô restent en place pendant que la liste
            // défile. `pinSpacing: false` : la grille tient déjà la hauteur,
            // c'est la colonne de droite qui la fixe.
            var head = page.querySelector('.pj-gains__head');
            var list = page.querySelector('.pj-gains__list');

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
        },

    });

}());
