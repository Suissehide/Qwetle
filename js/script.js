
/*!
 * Script 0.0.1
 * 
 * @license Copyright 2021, Qwetle. All rights reserved.
 * @author: Léo
 */

// console.image("data:@file/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAALWSURBVHhe7Zk/aBRBFMY3BkRQYypRsBKFiHIYMIoGFDSVghgLK6+4RkGrVJqzj5EUVykqgsVpE4ugoCDEwiJaRDEcikLEShSs/FdYKNH9dj6L0cmb3ZtVz3k/SL5ZAkeY95s3c7NdCz9IImaJyWjRCTAZLToBJqMl+gnIvQ0ODRw0o4zp2Vtm1JmoAb4GsPKP795Evm++Qu67NoLsVBPUAMkAe81/rNSQ8xOHkLYJRflbBqkBLgNY+Tfj15Fv+1cg1z75jHz+9B1y05bVSD73VtcjfaFBo5PnkKEYm7lsRoujBkgG3DvaQLLSkgn8uy/8nIkzp5AHjk8ik1pvlnmZ+4Kon9yPlExQA1wGEJrA7j9bqSAJuz/PB43lCG9qF7MesNCzA1m48j95mcXcOoRkghrgawB7AWHlXWb4wu4/dv4OMtn6Osu22YDf9cG9SDXAgWgAsU+ExGWGjdRDpk88QAajfxlCe4CAtwE2rt6Ql9IMMNSvHEaqAQ6CGzDQaiF7WleRvox0Z/v27r4byJV7Cv1bv6AGCAQ3gGt6avNDZKhKFkUNECjNAHb125eOIGe6vyLLYnTjFNI2Tg0Q6Pge8Ol+F/Ls/DDSNkENEPhnzgE225euMaNi0ASaoQY4CG4AoQm+2MYUfU9QHzxmRhmuyhM1oCwDfLF7Bu8N+Fz2G6PoDcg9AWnl05+0UqzW70gr69MH0huioveJIdAekLcH5F37PBlKu0WoXSAvaoCvAay8fbvLCkrrmCbYfcN1YlQD/hCFDSCsvLTWXQYQmsBvkcPPdiL1HFAyogGsPFls709hJW0TfA3g7XDjW/aOcFvfKqTNeLNpRu2hBrgMOF2tIh+9+IDkHd/QhV1IXxNIqMrbtGuCGuBrgH3H52uCC9sQ4lt5oga0iWgAkUzIS95Ku1AD2kQ8B7hMsAlVUV/0HBAI0YD/negN0AkwGS06ASajJfIJSJLvukqenu1MsBgAAAAASUVORK5CYII=");

/*
|--------------------------------------------------------------------------
| 
|--------------------------------------------------------------------------
*/

gsap.registerPlugin(ScrollTrigger);

gsap.to(".blue-cube", {
    scrollTrigger: {
        trigger: ".project",
        toggleActions: "restart none reverse none",
        start: "38% center",
        end: "+=1 center",
        markers: true,
    },
    x: -500,
    ease: 'none',
    duration: 0.5,
})


// $(".heading").scroll(function () {
//     $("#log").append("<div>Handler for .scroll() called.</div>");
// });

function goToProject() {
    var tl = gsap.timeline();

    $('html, body').css({
        overflow: 'auto',
        height: 'auto'
    });

    tl.to(window, {
        scrollTo: { y: innerHeight, autoKill: false },
        duration: 1
    });

    // tl.to('.blue-cube', 1, {
    //     x: -500,
    //     ease: Power1.easeOut
    // });
}

$('.heading').bind('mousewheel', function (e) {
    if (e.originalEvent.wheelDelta / 120 > 0) {

    }
    else {
        // goToProject();
    }
});

$('.btn-next').click(function () {
    goToProject();
})


function goToHeading() {
    var tl = gsap.timeline();

    tl.to(window, {
        scrollTo: { y: 0, autoKill: false },
        duration: 1,
        onComplete: function () {
            $('html, body').css({
                overflow: 'hidden',
                height: '100%'
            });
        }
    });
}

$('.project').bind('mousewheel', function (e) {
    if (e.originalEvent.wheelDelta / 120 > 0) {
        // goToHeading();
    }
    else {

    }
});



