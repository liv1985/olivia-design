/*
This is the main file that builds the body of the page using DOThtml.
Import it before usercscript.js, but after <body>.
*/

var gridModeEnabled = false;
var changingGridMode = false;
var gridMode = function(){
    if(changingGridMode) return;
    changingGridMode = true;
    $("#goleft").hide();
    $("#goright").hide();
    $("#project-scroller").animate({padding: "10%"});
    $("#project-number-" + currentFrame).animate({width: "20%"});
    dotcss("body").backgroundColor.animate("#000000");
    setTimeout(function(){
        $("#project-scroller").css("overflowY", "scroll");
        $(".projectblocks").css("width", "20%");
        $(".projectblocks").css("height", "200px;");
        $(".projectblocks").css("zoom", "10%");
        $(".projectblocks").show(400, function(){
            $("#overlay-stopper").hide();
            $('html, body').animate({
                scrollTop: $("#project-number-" + currentFrame).offset().top
            });
            gridModeEnabled = true;
            changingGridMode = false;
        });
    }, 400);
}

var presentationMode = function(){
    if(changingGridMode) return;
    changingGridMode = true;
    $("#project-number-" + currentFrame).animate({width: "100%"});
    $("#project-scroller").animate({padding: "0%"});
    $("#overlay-stopper").show();
    $("#project-scroller").css("overflowY", "hidden");
    $("#project-scroller").children().not("#project-number-" + currentFrame).hide(400, function(){
        $(".projectblocks").css("width", "100%");
        $(".projectblocks").css("height", "100%");
        $(".projectblocks").css("zoom", "100%");
        gridModeEnabled = false;
        changingGridMode = false;
        $("#goleft").show();
        $("#goright").show();
        scrollToCurrentProject();
    });
}

dot.createWidget("imgslide", function(file){
    return dot.div().style(dotcss.widthP(100).heightP(100).backgroundImage("userimages/" + file).backgroundRepeat("no-repeat").backgroundSize("contain").backgroundPosition("center center"));
});

var currentFrame = 0;
var frameCount = 0;

var allProjects = [];

var buildProject = function(title, fullDescription, tags, projectMarkup, backgroundColor, activateFunction, deactivateFunction){
    var thisFrameNumber = frameCount;
    allProjects.push({
        main: dot.div(
            dot.div(
                dot.div(projectMarkup).style(dotcss.display("table-cell").textAlign("center").verticalAlign("middle").margin("auto"))
            ).style(dotcss.widthP(100).heightP(100).display("table").verticalAlign("top"))
        ).class("projectblocks").id("project-number-" + frameCount).style(dotcss.widthP(100).heightP(100).display("none").verticalAlign("top")).onclick(function(){
            currentFrame = thisFrameNumber;
            presentationMode();
        }),
        title: title,
        description: fullDescription,
        tags: tags,
        backgroundColor: backgroundColor,
        activateFunction: activateFunction,
        deactivateFunction: deactivateFunction
    });
    frameCount++;
};


//var currentlyScrolling = false;
//var triedToScroll = false;
var scrollToCurrentProject = function(){

    $("#project-scroller").children().not("#project-number-" + currentFrame).hide(400);
    $("#project-number-" + currentFrame).show(400);

    dotcss("body").backgroundColor.animate(allProjects[currentFrame].backgroundColor || "#000000");

    if(allProjects[currentFrame].activateFunction) allProjects[currentFrame].activateFunction();
}

var buildPage = function(){

    dotcss("body").backgroundColor("black").overflow("hidden");
    dot("body")
    .div(
        dot.each(allProjects, function(p){
            return p.main;
        })
    ).id("project-scroller").style(dotcss.position("absolute").top(0).bottom(0).left(0).right(0).overflow("hidden"))

    //Gui overlay div.
    .div().id("overlay-stopper").style(dotcss.position("fixed").top(0).bottom(0).left(0).right(0))

    //.div().style(dotcss.position("absolute").topP(0).heightP(20).leftP(20).rightP(20).cursor("pointer"))
    .div().onclick(function(){
        if(allProjects[currentFrame].deactivateFunction) allProjects[currentFrame].deactivateFunction();
        currentFrame--;
        if(currentFrame < 0) currentFrame = 0;
        scrollToCurrentProject();
    }).id("goleft").style(dotcss.position("fixed").top(200).bottomP(0).leftP(0).widthP(20).cursor("pointer"))
    .div().onclick(function(){
        if(allProjects[currentFrame].deactivateFunction) allProjects[currentFrame].deactivateFunction();
        currentFrame++;
        if(currentFrame >= frameCount) currentFrame = frameCount - 1;
        scrollToCurrentProject();
    }).id("goright").style(dotcss.position("fixed").topP(0).bottomP(0).rightP(0).widthP(20).cursor("pointer"))
    /*.div().onclick(function(){ //This feature doesn't work as well as I'd like.
        if(gridModeEnabled) presentationMode();
        else gridMode();
    }).style(dotcss.position("fixed").topP(0).height(200).leftP(0).width(200).backgroundColor(0,255,0, 0.2).cursor("pointer"))*/
    scrollToCurrentProject();
}