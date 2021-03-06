/*
 jQuery module to get URL parameters.
 Copied from: http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
 Minified.
 */
$.urlParam = function (a) {
    let b = new RegExp("[?&]" + a + "=([^&#]*)").exec(window.location.href);
    if (b == null) {
        return null;
    } else {
        return decodeURI(b[1]) || 0;
    }
};

//Our stuff
$(document).ready( ()=> {
    const batchID = $.urlParam('batchid');
    const name = $.urlParam('name');
    const feature = $.urlParam('feature');
    const random = $.urlParam('random');
    let image_div = $("#image");
    let seadragon = $("#openseadragon");
    let viewer;

    let choice;
    let batch_status;
    let image;

    $("#user").text(name);
    $("#feature").text(feature);

    // acquire image status (testing)
    $.get("/batch-status", {batchid: batchID, user: name, feature: feature}, (data) => {
        batch_status = data;
        // now we can pull the first image
        getNextImage();
    })
    .fail((err) => {
        showModalServerError(err, true);
    });

    document.onkeyup = function (event) {
        let e = (!event) ? window.event : event;
        switch (e.keyCode) {
            //left arrowkey
            case 37:
                choice = false;
                add_annotation();
                break;
            //right arrowkey
            case 39:
                choice = true;
                add_annotation();
                break;
        }
    };

    let good_classification = function() {
        choice = true;
        add_annotation();
    };
    let bad_classification = function() {
        choice = false;
        add_annotation();
    };

    let good = $("#good");
    let bad = $("#bad");
    let polaroid = $("#polaroid");

    bad.hover( ()=> {
        polaroid.css("border-color", "red");
        polaroid.css("border-width", "5px");
    }, ()=> {
        polaroid.css("border-color", "whitesmoke");
        polaroid.css("border-width", "1px");
    });

    good.hover( ()=> {
        polaroid.css("border-color", "green");
        polaroid.css("border-width", "5px");

    }, ()=> {
        polaroid.css("border-color", "whitesmoke");
        polaroid.css("border-width", "1px");
    });

    let good_button = $("#good-button");
    let bad_button = $("#bad-button");

    bad.click(bad_classification);
    bad_button.click(bad_classification);
    //takes image_div and applies "swipeleft" event
    //to the image
    image_div.hammer().on("swipeleft", bad_classification);

    good.click(good_classification);
    good_button.click(good_classification);
    //Takes image_div and applies "swiperight" event
    //to the image
    image_div.hammer().on("swiperight", good_classification);

    function add_annotation() {
        if (image) {
            $.post("annotate", {imageid: image, user: name, annotation: choice, feature: feature, batchid: batchID})
                .done(() => {
                    getNextImage()
                })
                .fail(err => {
                    showModalServerError(err, true);
                })
        }
        else {
            window.location.href = '/complete'
        }
    }

    function openSeaDragon() {
        image_div.hide();
        let tileSources = {
            type: 'image',
            url: `/images?id=${image}&large=${true}`,
        };
        viewer = OpenSeadragon({
            id: "openseadragon",
            prefixUrl: '/scripts/openseadragon_images/',
            autoHideControls: false,
            showZoomControl: false,
            defaultZoomLevel: 0,
            minZoomLevel: 0.5,
            maxZoomLevel: 5
        });
        viewer.addHandler('open-failed', (err) => {
            console.log(err);
            showModalClientError("Couldn't open full-sized image", true);
        });
        // This block is activated when the client is on a mobile device.
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            viewer.fullPageButton.removeAllHandlers();
            viewer.fullPageButton.addHandler("click", closeSeaDragon);
        }
        else {
            viewer.fullPageButton.addHandler("click", ()=> {
                setTimeout(()=>{viewer.viewport.goHome(true)}, 100);
            });
        }
        viewer.open(tileSources);
        seadragon.show();
        viewer.addHandler("full-screen", (eventData)=> {
            fullScreenButton = $("[title|='Toggle full page']");
            if (eventData.fullScreen) {
                // changing to fullscreen
                fullScreenButton.css("left", ()=> {
                    return $('body').width() - 120;
                })
            }
            else {
                fullScreenButton.css("left", "0vw");
            }

        });
        // $("[title|='Toggle full page']").css("left", "90vw");
        viewer.setFullScreen(true);
    }

    function closeSeaDragon() {
        viewer.setFullScreen(false);
        // timeout to prevent the div from being removed before fullscreen is reset
        setTimeout(() => {
            viewer.destroy();
            viewer = null;
            seadragon.hide();
            image_div.show();
        }, 250)
    }

    image_div.hammer().on('doubletap', openSeaDragon);
    image_div.data("hammer").get('doubletap').set({threshold: 20, posThreshold: 100, interval: 500});

    function getNextImage() {
        // set current image to 1 i.e. annotated
        if (image) {
            batch_status.find((item) => {
                return item.id === image;
            }).status = 1;
        }
        // get next unannotated image
        if (!random) {
            image = batch_status.find((item) => {
                return item.status === 0;
            });
        }
        else {
            // get only unannotated images
            let unannotated = batch_status.filter((item) => {
                return item.status === 0;
            });
            // randomly chose one
            image = unannotated[Math.floor(Math.random() * unannotated.length)]
        }
        if (image === undefined) {
            // batch done, do something here
            window.location.href = '/complete'
        }
        else {
            image = image.id;
            if (viewer) {
                closeSeaDragon()
            }
            let imgURL = '/images?id=' + image;
            image_div
                .on("error", (err) => {
                    // if the image failed to retrieve, find out why
                    $.get(imgURL)
                        .done(() => {
                            // this should never happen, but if it does we'll just try again
                            image_div.attr('src', imgURL);
                        })
                        .fail(err => { showModalServerError(err) });
                })
                .attr('src', imgURL);
        }
    }
});


