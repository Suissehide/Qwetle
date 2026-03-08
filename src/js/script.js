/*!
 * Script 0.0.1
 *
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

gsap.registerPlugin(ScrollTrigger);

gsap.to(".blue-cube", {
    scrollTrigger: {
        trigger: ".project",
        toggleActions: "restart none reverse none",
        start: "38% center",
        end: "+=1 center",
    },
    x: -500,
    ease: 'none',
    duration: 0.5,
});

function goToProject() {
    $('html, body').css({ overflow: 'auto', height: 'auto' });
    gsap.to(window, {
        scrollTo: { y: innerHeight, autoKill: false },
        duration: 1,
    });
}

$('.btn-next').click(goToProject);

// Portfolio section animations
gsap.from(".project-header > *", {
    scrollTrigger: {
        trigger: ".project-header",
        start: "top 82%",
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
});

gsap.from(".card", {
    scrollTrigger: {
        trigger: ".bento-grid",
        start: "top 80%",
    },
    y: 60,
    opacity: 0,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out",
});

gsap.from(".project-cta", {
    scrollTrigger: {
        trigger: ".project-cta",
        start: "top 88%",
    },
    y: 40,
    opacity: 0,
    duration: 0.7,
    ease: "power3.out",
});


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
