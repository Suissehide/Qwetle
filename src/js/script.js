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
