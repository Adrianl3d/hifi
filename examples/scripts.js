//  Scripts.js
//  Created by Adrian
//  Slightly modified by Thoys
//
//  Adrian McCarlie 30-4-2015
//  This script demonstrates 3d Text overlays.
//  Copyright 2014 High Fidelity, Inc.
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

//  Creates a grid of overlays and displays public scripts in columns, each cell displaying a script.
//  Hover over an overlay to highlight, click on a overlay to select, click off to deselect.
//  Press Delete to hide, Delete to show.

const BUTTON_TYPE_FOLDER = 0;
const BUTTON_TYPE_SCRIPT = 1;

var textColor = {red: 255, green: 255, blue: 255};
var backColorFolder = {red: 120, green: 120, blue: 120};
var backColorFolderHover = {red: 0, green: 120, blue: 120};
var backColorFolderActive = {red: 0, green: 120, blue: 120};
var backColorScript = {red: 40, green: 40, blue: 40};
var backColorScriptHover = {red: 0, green: 127, blue: 124};
var backgroundAlpha = 0.8;
var fontSize = 12.0;
var startPosition = {x: -1.7, y: 1.0, z: -3};
var overlaySize = {x: 0.3, y: 0.2, z: 0.2};
var space = {x: 0.02, y: 0.02, z: 0};
var blockSize = Vec3.sum(overlaySize, space);
var myPosition = MyAvatar.position;
var newPosition = Vec3.sum(myPosition, startPosition);
var selected = false;
var rows = 10;
var engaged = true;
var preset = "";
var textSizeMeasureOverlay = Overlays.addOverlay("text3d", {
    visible: false,
    lineHeight: 0.03,
    topMargin: 0.01,
    leftMargin: 0.01,
    bottomMargin: 0.01,
    rightMargin: 0.01
});
var originalProperties = {
    position: newPosition,
    radius : 30,
    color: textColor,
    backgroundColor: backColorFolder,
    dimensions: overlaySize,
    damping: 0,
    velocity: {x: 0, y: 0, z: 0},
    text: "",
    lifetime: -1,
    lineHeight: 0.03,
    alpha: 1.0,
    backgroundAlpha: 1.0,
    visible: true,
    topMargin: 0.01,
    leftMargin: 0.01,
    bottomMargin: 0.01,
    rightMargin: 0.01,
    imageURL: "http://lets3d.com/hifi/3dOverlaySubImage.png"
};

function findIndexByProperty(source, property, value) {
    for (var i = 0; i < source.length; i++) {
        if (source[i][property] === value) {
            return i;
        }
    }
    return -1;
}

var buttons = [];

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// recursive function to walk through all folders in public scripts
function outputPublicScriptFolder(nodes) {
    var results = {};
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type == "folder") {
            results[nodes[i].name] = outputPublicScriptFolder(nodes[i].children);
            continue;
        }
        results[nodes[i].name] = nodes[i].url;
    }
    return results;
}

var globalObject = outputPublicScriptFolder(ScriptDiscoveryService.getPublic(), "");
globalObject["main1"] = {};
var mainIndex = 1;

for (var anObject in globalObject) {
    if (endsWith(anObject, ".js")) {
        if (Object.keys(globalObject["main" + mainIndex]).length > 5) {
            mainIndex++;
            globalObject["main" + mainIndex] = {};
        }
        globalObject["main" + mainIndex][anObject] = globalObject[anObject];
        delete globalObject[anObject];
    }
}
var rows = Object.keys(globalObject).length;

function onKeyPressEvent(key) {
    if (key.key == 16777223) { // Delete key
        print("key key = " + key.key);
        if (engaged == true){ 
            engaged = false;
            hide();
        } else { 
            engaged = true; 
            show();   
        } 
    } else if (key.key == 32) { // SpaceBar
        clicked(preset);
    }
}

function hide() {
    for (var i = 0; i < buttons.length; i++) {
        Overlays.editOverlay(buttons[i].overlay, {visible: false});
    }
}

function show() {
    for (var i = 0; i < buttons.length; i++){
        Overlays.editOverlay(buttons[i].overlay, {visible: true});
    }
}

var titleKeys = Object.keys(globalObject);
for (var i = 0; i < rows; i++) {
    var newProperties = JSON.parse(JSON.stringify(originalProperties));
    newProperties.backgroundAlpha = 0.8,
    newProperties.position.x = newProperties.position.x + (((overlaySize.x + space.x)) * i);
    newPosition = Vec3.sum(myPosition, startPosition);
    newProperties.position.y = newPosition.y;

    var newText = titleKeys[i];
    newProperties.text = newText;
    addButton(newProperties, BUTTON_TYPE_FOLDER, globalObject[newText], 0);
}

function onMousePressEvent(event) {
    if (engaged) {
        var pickRay,
        clickedOverlay,
        ENABLE_VR_MODE = "Enable VR Mode";
        if (true || Menu.isOptionChecked(ENABLE_VR_MODE)) {
            pickRay = Camera.computePickRay(event.x, event.y);
            clickedOverlay = Overlays.findRayIntersection(pickRay).overlayID;
        } else {
            clickedOverlay = Overlays.getOverlayAtPoint({ x: event.x, y: event.y });
        }
        clicked(clickedOverlay);
    }
}

function onMouseMoveEvent(event) {
    if (engaged) {
        var pickRay,
        mousedOverlay,
        ENABLE_VR_MODE = "Enable VR Mode";
        if (true || Menu.isOptionChecked(ENABLE_VR_MODE)) {
            pickRay = Camera.computePickRay(event.x, event.y);
            mousedOverlay = Overlays.findRayIntersection(pickRay).overlayID;
        } else {
            mousedOverlay = Overlays.getOverlayAtPoint({ x: event.x, y: event.y });
        }
         moused(mousedOverlay);
         preset = mousedOverlay;
    }
}

function moused(mousedOverlay) {
    if (engaged) {
        var thisBGColor = Overlays.getProperty(mousedOverlay, "backgroundColor");
        var buttonRows = buttons.length;
        for (var i = 0; i < buttonRows; i++){
            Overlays.editOverlay(buttons[i].overlay, {backgroundColor: (buttons[i].type === BUTTON_TYPE_FOLDER ? backColorFolder : backColorScript)});
        }
        var n = findIndexByProperty(buttons, 'overlay', mousedOverlay);
        if (n !== -1) {
            Overlays.editOverlay(mousedOverlay, {backgroundColor: (buttons[n].type === BUTTON_TYPE_FOLDER ? backColorFolderHover : backColorScriptHover)});
        }
    }
}

function removeButtonsOnDepth(depth) {
    var buttonRows = buttons.length;
    for (var i = buttonRows - 1; i > -1; i--){
        if (buttons[i].depth >= depth) {
            Overlays.deleteOverlay(buttons[i].overlay);
            buttons.splice(i, 1);
        }
    }
}

function clicked(clickedOverlay) {
    var buttonIndex = findIndexByProperty(buttons, 'overlay', clickedOverlay);
    if (engaged) {
        selected = true;  
        var thisText = Overlays.getProperty(clickedOverlay, "text");
        var buttonRows = buttons.length;
        for (var i = 0; i < buttonRows; i++){
            Overlays.editOverlay(buttons[i].overlay, {backgroundColor: (buttons[i].type === BUTTON_TYPE_FOLDER ? backColorFolder : backColorScript)});
        }
        if (buttonIndex !== -1) {
            Overlays.editOverlay(clickedOverlay, {backgroundColor: (buttons[buttonIndex].type === BUTTON_TYPE_FOLDER ? backColorFolder : backColorScript)});
            if (buttons[buttonIndex].type === BUTTON_TYPE_FOLDER) {
                removeButtonsOnDepth(buttons[buttonIndex].depth + 1);
                var contentObject = buttons[buttonIndex].content;
                var contentKeys = Object.keys(contentObject);
                var columns = contentKeys.length;
                var buttonProperties = buttons[buttonIndex].properties;
                var axis = (buttons[buttonIndex].depth % 2 === 1) ? 'x' : 'y';
                for (var j = 0; j < columns; j++) {
                    var newProperties = JSON.parse(JSON.stringify(buttonProperties));
                    newProperties.position[axis] = (newProperties.position[axis] + ((axis === 'x' ? 1 : -1) * ((overlaySize[axis] + space[axis]) * (j + 1))));
                    newText = contentKeys[j];
                    if (newText.length > 13) {
                        var splitUpArray = newText.split(/(?=[A-Z])/);
                        print("SPLITUPARRAY: "+ JSON.stringify(splitUpArray));
                        var resultLines = [];
                        var currentLine = "";
                        for (var h = 0; h < splitUpArray.length; h++) {
                            print("WORDLOOP for h = " + h);
                            print("CURRENT selected word is " + splitUpArray[h]);
                            print("SIZETEST width = " + Overlays.textSize(textSizeMeasureOverlay, currentLine + splitUpArray[h] + ((h < splitUpArray.length - 1) ? "-" : "")).width);
                            if (Overlays.textSize(textSizeMeasureOverlay, currentLine + splitUpArray[h] + ((h < splitUpArray.length - 1) ? "-" : "")).width > 0.3) {
                                print("The word was too big so the last line is pushed");
                                resultLines.push(currentLine);
                                currentLine = "";
                            }
                            currentLine += splitUpArray[h];
                        }
                        if (currentLine !== "") {
                            resultLines.push(currentLine);
                        }
                        newText = resultLines.join("-\n");
                    } 
                    newProperties.text = newText;
                    newProperties.backgroundAlpha = 0.6;
                    addButton(newProperties, endsWith(contentKeys[j], ".js") ? BUTTON_TYPE_SCRIPT : BUTTON_TYPE_FOLDER, contentObject[contentKeys[j]], buttons[buttonIndex].depth + 1);
                }
            } else if (buttons[buttonIndex].type === BUTTON_TYPE_SCRIPT) {
                Script.load(buttons[buttonIndex].content);
            }
        } else {
            selected = false;
        }
    }
}

function addButton(properties, buttonType, content, depth) {
    buttons.push({overlay: Overlays.addOverlay("text3d", properties), properties: properties, type: buttonType, content: content, depth: depth});
}

function scriptEnding() {
    var buttonRows = buttons.length;
    for (var i = 0; i < buttonRows; i++){
        Overlays.deleteOverlay(buttons[i].overlay);
    }
    Overlays.deleteOverlay(textSizeMeasureOverlay);
}

Controller.mousePressEvent.connect(onMousePressEvent);
Controller.mouseMoveEvent.connect(onMouseMoveEvent);
Controller.keyPressEvent.connect(onKeyPressEvent);
Script.scriptEnding.connect(scriptEnding);
