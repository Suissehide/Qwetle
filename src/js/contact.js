/*!
 * Contact 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

// Le site est servi par un nginx statique : aucun endpoint pour poster le
// formulaire. Le bouton compose donc un mailto et laisse le client mail de
// l'utilisateur prendre la suite — c'est dit sous le bouton, pour que
// l'ouverture d'une fenêtre de mail ne soit pas une surprise.
// Le jour où un backend arrive, seul ce fichier change.
(function () {
    var form = document.querySelector('.contact__form');
    if (!form) return;

    var DESTINATAIRE = 'contact@qwetle.fr';

    function valeur(nom) {
        var champ = form.elements[nom];
        return champ ? champ.value.trim() : '';
    }

    // Composition isolée du reste : c'est la seule partie qui a une logique, et
    // elle est ainsi vérifiable sans déclencher l'ouverture du client mail.
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

        // encodeURIComponent et non escape : les accents et les retours à la
        // ligne doivent survivre au passage dans l'URL.
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

    // Exposé uniquement pour pouvoir vérifier la composition depuis la console
    // sans ouvrir de fenêtre de mail.
    window.qwetleComposerMailto = composerMailto;
}());

// Le cube de la colonne de gauche reprend le mouvement de celui des
// compétences, mais sans section à traverser : ici il tourne en boucle, très
// lentement. Même vocabulaire graphique, sans dépendre du défilement d'une
// page qui en a peu.
(function () {
    var cube = document.querySelector('.contact__cube');
    if (!cube) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    var back  = cube.querySelector('.skills__cube-face--back');
    var front = cube.querySelector('.skills__cube-face--front');

    gsap.to(front, { rotate: '+=360', duration: 90, ease: 'none', repeat: -1 });
    gsap.to(back,  { rotate: '-=360', duration: 120, ease: 'none', repeat: -1 });
}());
