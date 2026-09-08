/*!
 * Script 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

gsap.registerPlugin(ScrollTrigger);

function goToProject() {
    $('html, body').css({ overflow: 'auto', height: 'auto' });
    gsap.to(window, {
        scrollTo: { y: innerHeight, autoKill: false },
        duration: 1,
    });
}

$('.btn-next').click(goToProject);

// Barre de navigation — ouverture du panneau replié sous 900px
(function () {
    var content = document.querySelector('.nav-content');
    var toggle  = content && content.querySelector('.nav-toggle');
    if (!toggle) return;

    function ouvrir(oui) {
        content.classList.toggle('is-open', oui);
        toggle.setAttribute('aria-expanded', String(oui));
        toggle.setAttribute('aria-label', oui ? 'Fermer le menu' : 'Ouvrir le menu');
    }

    toggle.addEventListener('click', function () {
        ouvrir(!content.classList.contains('is-open'));
    });

    // Échap referme et rend le focus au bouton : sans ça, au clavier, on entre
    // dans le panneau sans savoir comment en sortir.
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && content.classList.contains('is-open')) {
            ouvrir(false);
            toggle.focus();
        }
    });

    // Au passage en desktop le panneau redevient une barre : sans cette remise
    // à zéro, le bouton resterait annoncé « déplié » pour un menu qui n'existe
    // plus.
    var large = window.matchMedia('(min-width: 900px)');
    var surChangement = function (e) { if (e.matches) ouvrir(false); };
    if (large.addEventListener) large.addEventListener('change', surChangement);
    else large.addListener(surChangement);
}());

// À propos — apparition au scroll, bloc par bloc
gsap.utils.toArray([".about__eyebrow", ".about__statement", ".about__lead", ".practice__item", ".skills__statement", ".skills__group"]).forEach(function (bloc) {
    gsap.from(bloc, {
        scrollTrigger: {
            trigger: bloc,
            start: "top 85%",
        },
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
    });
});


// Compétences — le cube tourne au fil du défilement de la section
(function () {
    var cube = document.querySelector('.skills__cube');
    if (!cube) return;

    // Lu une fois, comme `animationsOk` dans portfolio.js. Même seuil que le
    // masquage CSS du cube : en dessous, il n'y a pas de cible à l'écran.
    if (!window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)').matches) return;

    var back  = cube.querySelector('.skills__cube-face--back');
    var front = cube.querySelector('.skills__cube-face--front');

    // Course lue sur toute la traversée de la section, de son entrée par le bas
    // jusqu'à sa sortie par le haut : le cube fait un quart de tour pendant
    // qu'on parcourt la liste. Un seul ScrollTrigger, porté par la timeline
    // plutôt qu'un par carré, pour que les deux faces restent en phase.
    // `scrub: 1` amortit d'une seconde — sans lui, la rotation copie la molette
    // au pixel et devient saccadée. `invalidateOnRefresh` parce que les bornes
    // dépendent du pin-spacer de 450vh qu'insère l'épinglage des projets, plus
    // haut dans la page : elles doivent être relues à chaque recalcul.
    var tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.about__skills',
            start: 'top bottom',
            // Pas `bottom top` : la section est la dernière avant le pied de
            // page, on ne peut donc pas la faire sortir par le haut de l'écran.
            // La course finissait au-delà du défilement possible et le cube
            // n'atteignait jamais que 78 % de son quart de tour. `center` étale
            // le mouvement sur la lecture de la liste, là où `bottom` le
            // bouclait avant même que la section soit entièrement à l'écran.
            end: 'bottom center',
            scrub: 1,
            invalidateOnRefresh: true
        }
    });

    // État de départ posé par `gsap.set`, comme les fondus de portfolio.js :
    // dans une timeline scrubée, GSAP a besoin du point de départ sans que le
    // rendu immédiat d'un `fromTo` ne vienne le figer.
    gsap.set(front, { rotate: -12, yPercent: 14 });
    gsap.set(back,  { rotate: 16, yPercent: 22, scale: 0.88 });

    // Les deux carrés tournent en sens contraire : c'est ce décalage, et non un
    // dégradé, qui donne son épaisseur au motif.
    tl.to(front, { rotate: 78, yPercent: -14, ease: 'none' }, 0);
    tl.to(back,  { rotate: -44, yPercent: -22, scale: 1.06, ease: 'none' }, 0);
}());


// Footer — cubes animés en arrière-plan (GSAP DOM)
(function () {
    var container = document.querySelector('.footer-cubes');
    if (!container) return;

    var COLORS = [
        'rgba(233,71,103)',   // paradise-pink
        'rgba(245,172,186)',  // cherry-blossom
        'rgba(47,65,87)',     // charcoal
    ];

    var W = window.innerWidth;

    function run(el, size, dur, spin) {
        gsap.to(el, {
            x: W + size * 2,
            rotate: '+=' + spin,
            duration: dur,
            ease: 'none',
            onComplete: function () {
                gsap.set(el, { x: -size * 2 });
                run(el, size, dur, spin);
            }
        });
    }

    for (var i = 0; i < 20; i++) {
        var size = Math.random() * 90 + 20;
        var dur  = Math.random() * 14 + 8;
        var spin = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 270 + 90);
        var col  = COLORS[Math.floor(Math.random() * COLORS.length)];
        var fill = Math.random() > 0.5;
        var top  = (Math.random() * 110 - 5).toFixed(1);

        var el = document.createElement('div');
        el.style.cssText =
            'position:absolute;' +
            'width:'         + size.toFixed(0)         + 'px;' +
            'height:'        + size.toFixed(0)         + 'px;' +
            'border-radius:' + (size * 0.2).toFixed(0) + 'px;' +
            'top:'           + top                     + '%;' +
            (fill ? 'background:' + col + ';'
                  : 'border:2.5px solid ' + col + ';');

        container.appendChild(el);

        // Position initiale aléatoire sur l'écran pour éviter le départ groupé
        gsap.set(el, { x: Math.random() * W, rotate: Math.random() * 360 });
        run(el, size, dur, spin);
    }
}());

gsap.from(".footer-brand, .footer-nav, .footer-contact", {
    scrollTrigger: {
        trigger: "footer",
        start: "top 95%",
    },
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: "power3.out",
});
