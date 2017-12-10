/*
USAGE:

Call the buildProject function once per project. This will create the list of projects. Usage of buildProject is as follows:

buildProject(title, fullDescription, tags, projectMarkup, backgroundColor, activateFunction, deactivateFunction)

title - A short title for the project (not implemented yet).
fullDescription - A full description for the project to appear in a popup pane (not implemented yet).
tags - A list of string tags to allow the project to be categorized and filtered (not implemented yet).
projectMarkup - The project body. HTML as a string is supported, but you are encouraged to use DOThtml.
    For more information on DOThtml, refer to the following link: https://jsideris.github.io/DOThtml/
backgroundColor - The background color for this project. BG will transition smoothly to this color.
activateFunction - Called when user scrolls to this frame.
deactivateFunction - Called when user navigates away from frame.

There's also a special type of project: an image slide. Image slides are simply full-page images.
There is a special/easy way to implement image slides using DOThtml:

dot.imgslide(filename)

where filename is the name of the image file inside of the userimages directory (you don't need to include the userimages/ part).
*/



buildProject("Souly4Good Poster", "", null, dot.imgslide("soulyposter.jpg"));
buildProject("Souly4Good Badge", "", null, dot.imgslide("soulyb1.png"));
buildProject("Souly4Good Badge", "", null, dot.imgslide("soulyb6.png"));
buildProject("Souly4Good Badge", "", null, dot.imgslide("soulyb7.png"));
buildProject("Souly4Good Badge", "", null, dot.imgslide("soulyb12.png"));
buildProject("Speechless", "", null, dot.imgslide("speechless.jpg"));
buildProject("Sophia Poster", "", null, dot.imgslide("sophia.png"));
buildProject("Alpine Express", "", null, dot.imgslide("aelogo.png"));
buildProject("Minima Animated Logo", "", null, 
    dot.div(dot.img().src("userimages/minima.png")).id("minimalogoimg").style("display:inline-block;position:relative;"),
"#f36523", function(){minimaAnimationOn = true;}, function(){minimaAnimationOn = false;});

buildProject("City Guard Animated Logo", "", null, 
    dot.div(
        dot.div().id("cityguardcity").style(dotcss.position("absolute").left(-160).top(-160).width(320).height(320).backgroundImage("userimages/cityguardlogoL1.png"))
        .div().id("cityguardc").style(dotcss.position("absolute").left(-160).top(-160).width(320).height(320).backgroundImage("userimages/cityguardlogoL2.png"))
        .div().id("cityguardg").style(dotcss.position("absolute").left(-160).top(-160).width(320).height(320).backgroundImage("userimages/cityguardlogoL3.png"))
    ).style("display:inline-block;position:relative;").h1("City Guard").id("cityguardname").style(dotcss.position("relative").top("100px").fontFamily("\"Segoe UI\",Arial,sans-serif").fontSize(72)),
"#ffffff", function(){
    //dotcss("#cityguardc").transform("rotate(89deg)");
    //dotcss("#cityguardg").transform("rotate(-89deg)");
    //TODO: figure out why my code doesn't work but jquery's does (on blackberry playbook).
    $("#cityguardc").css({transform: "rotate(89deg)"});
    $("#cityguardg").css({transform: "rotate(-89deg)"});
    $("#cityguardname").hide();
    setTimeout(function(){AnimateRotate("#cityguardc", 89, 0, 2000);AnimateRotate("#cityguardg", -89, 0, 2000, function(){
        //Animation done. Show cityguard text.
        $("#cityguardname").show(1000);
    }); }, 1000)});
buildProject("Cityguard Mockups & Landing Page", "", null, dot.imgslide("cgwebsite.png"));
    
buildProject("Alpine Express", "", null, dot.imgslide("factoryworld.png"));
buildProject("York Region New", "", null, dot.imgslide("yrnew.png"));
buildProject("York Region Old", "", null, dot.imgslide("yrold.png"));

//Minima logo stuff.
var bottlewords = [];
var minimaAnimationOn = false;
function animationTick() {
    for (var n, i, t = 0; t < bottlewords.length; t++)
        if (n = bottlewords[t], n.animate({
                top: "+=" + n.data("ys"),
                left: "+=" + n.data("xs"),
                opacity: n.data("life") / 10
            }, 200), n.data("ys", n.data("ys") - -2), i = n.data("life"), n.data("life", i - 1), i == 0) {
            n.remove();
            bottlewords.splice(t, 1);
            t--;
            continue
        }
    minimaAnimationOn && Math.random() > .2 && createNewBottleWord();
    setTimeout(animationTick, 200);
}

var createNewBottleWord = function() {
    var n = $("<p><\/p>").text("m");
    n.css("position", "absolute");
    n.css("top", "42px");
    n.css("left", "236px");
    n.css("color", "white");
    n.css("font-size", "15px");
    n.data("xs", 1 + (Math.random() * 1.5 - .5) * 10);
    n.data("ys", -1 - Math.random() * 10);
    n.data("life", 20);
    n.css("opacity", "0");
    $("#minimalogoimg").append(n);
    bottlewords.push(n)
}

var AnimateRotate = function(selector, startAngle, endAngle, duration, callback) {
    // caching the object for performance reasons
    var $elem = $(selector);

    // we use a pseudo object for the animation
    // (starts from `0` to `angle`), you can name it as you want
    $({deg: startAngle}).animate({deg: endAngle}, {
        duration: duration || 1000,
        step: function(now) {
            // in the step-callback (that is fired each step of the animation),
            // you can use the `now` paramter which contains the current
            // animation-position (`0` up to `angle`)
            $elem.css({
                transform: 'rotate(' + now + 'deg)'
            });
        },
        complete: callback
    });
}

$(function() {
    animationTick();
    scrollToCurrentProject();
});