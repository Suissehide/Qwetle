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


// Pied de page — rideau plein écran qui monte en fin de défilement
(function () {
    var footer = document.querySelector('.footer');
    if (!footer) return;

    // Liens à lettres roulantes : le texte de data-roll est découpé en
    // caractères doublés (.ch-top visible, .ch-bot en attente sous le masque).
    // Le lien porte déjà un aria-label, les lettres générées sont donc
    // masquées aux lecteurs d'écran pour ne pas être épelées deux fois.
    footer.querySelectorAll('.footer__roll[data-roll]').forEach(function (el) {
        var text = el.getAttribute('data-roll');
        el.removeAttribute('data-roll');
        Array.from(text).forEach(function (ch, i) {
            if (ch === ' ') {
                var space = document.createElement('span');
                space.className = 'ch-space';
                space.innerHTML = '&nbsp;';
                el.appendChild(space);
                return;
            }
            var wrap = document.createElement('span');
            wrap.className = 'ch-wrap';
            wrap.setAttribute('aria-hidden', 'true');
            wrap.style.setProperty('--i', i);
            wrap.innerHTML = '<span class="ch-top">' + ch + '</span><span class="ch-bot">' + ch + '</span>';
            el.appendChild(wrap);
        });
    });

    // Sans GSAP, ou sous mouvement réduit, on s'arrête là : le pied de page
    // reste un bloc ordinaire (voir .footer dans style.css).
    if (!window.gsap || !window.ScrollTrigger) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    var space = document.querySelector('.footer-space');
    if (!space) return;

    // La classe bascule le pied de page en position fixe et donne à l'espace
    // vide sa hauteur : c'est lui que le défilement traverse.
    document.documentElement.classList.add('footer-reveal');

    var letters  = footer.querySelectorAll('.footer__letter > span');
    var tops     = footer.querySelectorAll('.footer__top .ch-top');
    var left     = footer.querySelectorAll('.footer__motif[data-side="left"]');
    var right    = footer.querySelectorAll('.footer__motif[data-side="right"]');
    var pictures = footer.querySelectorAll('.footer__motif img');

    // Parallaxe souris sur les motifs, amortie, uniquement pendant que le pied
    // de page est à l'écran : une boucle rAF qui s'éteint dès qu'il disparaît.
    var mx = 0, my = 0, sx = 0, sy = 0, visible = false;
    document.addEventListener('mousemove', function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    function parallaxe() {
        if (!visible) return;
        sx += (mx - sx) * 0.05;
        sy += (my - sy) * 0.05;
        pictures.forEach(function (img, i) {
            var depth = 14 + i * 8;
            img.style.translate = (sx * -depth) + 'px ' + (sy * -depth) + 'px';
        });
        requestAnimationFrame(parallaxe);
    }
    function montrer() {
        footer.style.visibility = 'visible';
        if (!visible) { visible = true; parallaxe(); }
    }
    function cacher() {
        footer.style.visibility = 'hidden';
        visible = false;
    }

    // États de départ posés par gsap.set plutôt qu'en CSS : sans script, rien
    // n'est caché.
    gsap.set(letters, { yPercent: 110 });
    gsap.set(tops, { clipPath: 'inset(100% 0 0 0)' });
    gsap.set(left, { xPercent: -120 });
    gsap.set(right, { xPercent: 120 });

    // Une seule timeline scrubée sur la traversée de l'espace vide. Le rideau
    // et les motifs suivent la molette au pixel ; les lettres et les liens
    // partent un peu plus tard avec un amorti, pour finir avec la page.
    var tl = gsap.timeline({
        scrollTrigger: {
            trigger: space,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            // Recalculé après les épinglages créés plus tard par portfolio.js et
            // project-page.js : ScrollTrigger relit les déclencheurs dans l'ordre
            // de création, et sans cette priorité basse les bornes seraient
            // mesurées avant l'insertion de leurs espaceurs.
            refreshPriority: -1,
            onEnter: montrer,
            onEnterBack: montrer,
            onLeaveBack: cacher
        }
    });

    tl.fromTo(footer,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', ease: 'none', duration: 1 }, 0);
    tl.to(left,  { xPercent: 0, ease: 'none', duration: 1 }, 0);
    tl.to(right, { xPercent: 0, ease: 'none', duration: 1 }, 0);
    tl.to(letters, {
        yPercent: 0,
        ease: 'power3.out',
        duration: 0.6,
        stagger: { each: 0.05, from: 'start' }
    }, 0.3);
    tl.to(tops, {
        clipPath: 'inset(0% 0 0 0)',
        ease: 'power3.out',
        duration: 0.4,
        stagger: { each: 0.006, from: 'start' }
    }, 0.5);
}());
