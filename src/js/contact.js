/*!
 * Contact 0.2.0
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 *
 * Page /contact. Deux parties : la composition du mail et les tranches de
 * « après votre message », branchées en premier et hors de toute condition
 * de mouvement, parce que ce sont des commandes ; puis les animations, qui
 * s'effacent sans GSAP ou sous mouvement réduit.
 */

(function () {

    var page = document.querySelector('.ct');
    if (!page) return;

    /* ---------------------------------------------------------------------
       Le formulaire compose un mail
       Le site est servi par un nginx statique : aucun endpoint pour poster.
       Le bouton compose donc un mailto et laisse le client mail de
       l'utilisateur prendre la suite — c'est dit sous le bouton. Le jour où
       un backend arrive, seule cette partie change.
       --------------------------------------------------------------------- */

    (function () {

        var form = page.querySelector('.ct-form');
        if (!form) return;

        var DESTINATAIRE = 'contact@qwetle.fr';

        function valeur(nom) {
            var champ = form.elements[nom];
            return champ ? champ.value.trim() : '';
        }

        // Composition isolée du reste : c'est la seule partie qui a une
        // logique, et elle est ainsi vérifiable sans ouvrir le client mail.
        function composerMailto(c) {
            var objet = '[Qwetle] ' + c.type + ' — ' + c.nom + (c.societe ? ' (' + c.societe + ')' : '');

            var corps = [
                c.message,
                '',
                '—',
                'Nom : ' + c.nom,
                c.societe ? 'Société : ' + c.societe : null,
                'E-mail : ' + c.email,
                'Type de projet : ' + c.type,
            ].filter(function (ligne) {
                return ligne !== null;
            }).join('\n');

            // encodeURIComponent et non escape : les accents et les retours à
            // la ligne doivent survivre au passage dans l'URL.
            return 'mailto:' + DESTINATAIRE
                + '?subject=' + encodeURIComponent(objet)
                + '&body=' + encodeURIComponent(corps);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // La validation native a déjà filtré : le navigateur ne déclenche
            // « submit » que si les champs requis sont remplis.
            window.location.href = composerMailto({
                nom:     valeur('nom'),
                societe: valeur('societe'),
                email:   valeur('email'),
                type:    valeur('type'),
                message: valeur('message'),
            });
        });

        // Exposé uniquement pour vérifier la composition depuis la console
        // sans ouvrir de fenêtre de mail.
        window.qwetleComposerMailto = composerMailto;
    }());

    /* ---------------------------------------------------------------------
       Les tranches
       Une seule ouverte à la fois. Le survol suffit à la souris ; le focus
       et le clic font la même chose au clavier et au doigt. L'ouverture est
       animée en CSS par `flex` : rien à mesurer ici. Sous 900px la feuille
       de styles ouvre tout, et ces écouteurs n'ont plus d'effet visible.
       --------------------------------------------------------------------- */

    (function () {

        var tranches = Array.prototype.slice.call(page.querySelectorAll('.ct-slice'));
        if (!tranches.length) return;

        function ouvrir(cible) {
            tranches.forEach(function (tranche) {
                var actif = tranche === cible;
                var bouton = tranche.querySelector('.ct-slice__head');
                tranche.classList.toggle('is-open', actif);
                if (bouton) bouton.setAttribute('aria-expanded', String(actif));
            });
        }

        tranches.forEach(function (tranche) {
            tranche.addEventListener('mouseenter', function () { ouvrir(tranche); });
            tranche.addEventListener('focusin', function () { ouvrir(tranche); });
            tranche.addEventListener('click', function () { ouvrir(tranche); });
        });
    }());

    if (!window.gsap || !window.ScrollTrigger) return;

    // Lu une fois, comme sur les autres pages : sous mouvement réduit, rien
    // ne bouge, la page reste telle que la feuille de styles la pose.
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    /* ---------------------------------------------------------------------
       Entrée du hero
       Le texte monte, puis la carte de verre arrive légèrement plus petite
       et se pose. `fromTo` sur la carte pour que son état de départ soit
       rendu avant la première image.
       --------------------------------------------------------------------- */

    gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.ct-hero__title', { y: 40, opacity: 0, duration: 0.9 })
        .from('.pg-hero__lead', { y: 24, opacity: 0, duration: 0.7 }, '-=0.55')
        .from('.pg-hero__actions .pj-btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.45')
        .fromTo('.ct-form', { y: 50, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1.1 }, '-=0.9');

    /* ---------------------------------------------------------------------
       Décor de marque
       Les cubes flottent sur des durées premières entre elles, pour ne
       jamais repasser ensemble par la même position. Le carré bleu remonte
       et pivote pendant que le hero sort de l'écran.
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
        yPercent: -14,
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
       La promesse, mot à mot
       Même découpe que /about : GSAP 3.7 n'embarque pas SplitText, on
       remplace le texte par autant de spans que de mots.
       --------------------------------------------------------------------- */

    var idee = page.querySelector('.ct-idea__text');

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
       Les intertitres montent en apparaissant. Les tranches et les cartes
       arrivent un peu plus petites et grandissent jusqu'à leur taille au fil
       du défilement, puis s'estompent quand elles quittent l'écran par le
       haut : le regard reste sur ce qui est sous les yeux.
       --------------------------------------------------------------------- */

    gsap.utils.toArray(['.pg-head__title', '.pg-head__lead']).forEach(function (bloc) {
        gsap.from(bloc, {
            scrollTrigger: { trigger: bloc, start: 'top 88%' },
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
        });
    });

    gsap.utils.toArray(['.ct-slices', '.pj-card']).forEach(function (bloc) {
        gsap.fromTo(bloc, { scale: 0.9, opacity: 0 }, {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: bloc,
                start: 'top 92%',
                end: 'top 55%',
                scrub: 0.6,
            },
        });

        gsap.to(bloc, {
            opacity: 0.2,
            ease: 'none',
            scrollTrigger: {
                trigger: bloc,
                start: 'bottom 28%',
                end: 'bottom 4%',
                scrub: true,
            },
        });
    });

    /* ---------------------------------------------------------------------
       Autres canaux — les cubes flous
       Ils descendent et pivotent doucement pendant la traversée de la
       section, à des vitesses différentes : c'est ce décalage qui donne de
       la profondeur.
       --------------------------------------------------------------------- */

    var cubes = page.querySelectorAll('.ct-ways__cube');

    if (cubes.length) {
        var derive = gsap.timeline({
            scrollTrigger: {
                trigger: '.ct-ways',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });

        derive.fromTo(cubes[0], { y: -60, rotate: -8 }, { y: 120, rotate: 14, ease: 'none' }, 0);
        if (cubes[1]) derive.fromTo(cubes[1], { y: 40, rotate: 10 }, { y: -90, rotate: -24, ease: 'none' }, 0);
    }

}());
