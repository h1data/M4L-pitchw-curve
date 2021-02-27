/**
 * @fileoverview draw functions for PitchW curve Max for Live device
 * @version 1.0.0 (27, May, 2020)
 * @author h1data
 */

// global parameters
autowatch = 1;
inlets = 1;
outlets = 1;

var yPosition = 81;   // the pitch bend position

/** initial color settings
 *  attr: attribute name sent from live.colors object
 */
var RGBA = {
    fg: { attr: 'control_selection', r: 255, g: 201, b: 7, a: 128, a2: 64},
    bg: { attr: 'lcd_bg', r: 24, g: 30, b: 35, a: 255},
    line: { attr: 'lcd_frame', r: 130, g: 140, b: 150, a: 255, a2: 192, a3: 128}
};

/** @const base postion */
var BASE = {left: 2, top: 2, right: 18, bottom: 160, center: 81, height: (160 - 2)};

/** variable position RANGE indicator */
var RANGE = {left: 5, right: 15,
             from: {top: 0, bottom: 0},
             to: {top: 0, bottom: 0}
            };

// functions called by Max messages

/**
 * set color settings from live.colors
 * @param attr attribute name of live.colors
 * @param r red
 * @param g green
 * @param b blue
 * @param a alpha (not used)
 */
function setColor(attr, r, g, b, a) {
    for (var i in RGBA) {
        if(RGBA[i].attr === attr) {
            RGBA[i].r = Math.round(r * 255);
            RGBA[i].g = Math.round(g * 255);
            RGBA[i].b = Math.round(b * 255);
            redraw();
        }
    }
    if (attr === 'lcd_fg') {  // for Max 8 or upper
        RGBA.fg.r = Math.round(r * 255);
        RGBA.fg.g = Math.round(g * 255);
        RGBA.fg.b = Math.round(b * 255);
        redraw();
    }
}

/**
 * set range indecator represents position from m4l GUI
 * @param {Number} from 'From' pitch bend value
 * @param {Number} end 'End' pitch bend value
 */
function setRange(from, end) {
    if (from > end) {
        RANGE.from.top = getPositionY(from);
        RANGE.to.bottom = getPositionY(end);
    } else {
        RANGE.from.top = getPositionY(end);
        RANGE.to.bottom = getPositionY(from);
    }
    if (RANGE.to.bottom - RANGE.from.top >= 3) {
        RANGE.from.bottom = RANGE.from.top + 3;
        RANGE.to.top = RANGE.to.bottom - 3;
    } else {
        RANGE.from.bottom = RANGE.to.bottom;
        RANGE.to.top = RANGE.from.top;
    }
    redraw();
}

/**
 * draw objects received pitch bend value
 * @param {number} pb the pitchbend value 
 */
function msg_int(pb) {
    yPosition = getPositionY(pb);
    redraw();
}

// functions called from local

/**
 * redraw every shapes
 */
function redraw() {
    drawBG();
    drawMeter();
    drawPitchBend();
    drawRange();
}

/**
 * returns y position from pitch bend value
 * @param {number} value pitch bend value [0-16383]
 */
function getPositionY(value) {
    // 1.0 / 16383.0 -> 0.0000610388
    return Math.round((16383.0 - value) * 0.0000610388 * BASE.height + BASE.top);
}

/**
 * draw rectangles represents pitch bend
 */
function drawPitchBend() {
    if(yPosition < BASE.center) {
        if(yPosition > RANGE.to.bottom || yPosition < RANGE.from.top) {
            // out of range
            outRectMsg(BASE.left, yPosition, BASE.right + 1, BASE.center + 1, RGBA.fg, RGBA.fg.a2);
        } else if(RANGE.to.bottom < BASE.center) {
            outRectMsg(BASE.left, yPosition, BASE.right + 1, RANGE.to.bottom + 1, RGBA.fg, RGBA.fg.a);
            outRectMsg(BASE.left, RANGE.to.bottom + 1, BASE.right + 1, BASE.center + 1, RGBA.fg, RGBA.fg.a2);
        } else {
            outRectMsg(BASE.left, yPosition, BASE.right + 1, BASE.center + 1, RGBA.fg, RGBA.fg.a);
        }
    } else {
        if(yPosition > RANGE.to.bottom || yPosition < RANGE.from.top) {
            // out of range
            outRectMsg(BASE.left, BASE.center, BASE.right + 1, yPosition + 1, RGBA.fg, RGBA.fg.a2);
        } else if(RANGE.from.top > BASE.center) {
            outRectMsg(BASE.left, BASE.center, BASE.right + 1, RANGE.from.top - 1, RGBA.fg, RGBA.fg.a2);
            outRectMsg(BASE.left, RANGE.from.top, BASE.right + 1, yPosition + 1, RGBA.fg, RGBA.fg.a);
        } else {
            outRectMsg(BASE.left, BASE.center, BASE.right + 1, yPosition + 1, RGBA.fg, RGBA.fg.a);
        }
    }
}

/**
 * draw RANGE indicators represents From-To values
 */
function drawRange() {
    outLineMsg(BASE.left, RANGE.from.top, RANGE.left, RANGE.from.top, RGBA.fg, 255);
    outLineMsg(BASE.left, RANGE.from.top, BASE.left, RANGE.from.bottom, RGBA.fg, 255);
    outLineMsg(RANGE.right, RANGE.from.top, BASE.right, RANGE.from.top, RGBA.fg, 255);
    outLineMsg(BASE.right, RANGE.from.top, BASE.right, RANGE.from.bottom, RGBA.fg, 255);
    outLineMsg(BASE.left, RANGE.to.bottom, RANGE.left, RANGE.to.bottom, RGBA.fg, 255);
    outLineMsg(RANGE.right, RANGE.to.bottom, BASE.right, RANGE.to.bottom, RGBA.fg, 255);
    outLineMsg(BASE.left, RANGE.to.top, BASE.left, RANGE.to.bottom, RGBA.fg, 255);
    outLineMsg(BASE.right, RANGE.to.top, BASE.right, RANGE.to.bottom, RGBA.fg, 255);
}

/**
 * draw background to clear lcd display
 */
function drawBG() {
    outRectMsg(0, 0, 30, 170, RGBA.bg, 255);
}

/**
 * draw menter lines as decolation
 */
function drawMeter() {
    outLineMsg(BASE.left - 1, BASE.top, BASE.right + 1, BASE.top, RGBA.line, RGBA.line.a);
    outLineMsg(BASE.left - 1, 22, BASE.right + 1, 22, RGBA.line, RGBA.line.a3);
    outLineMsg(BASE.left - 1, 42, BASE.right + 1, 42, RGBA.line, RGBA.line.a2);
    outLineMsg(BASE.left - 1, 61, BASE.right + 1, 61, RGBA.line, RGBA.line.a3);
    outLineMsg(BASE.left - 1, BASE.center, BASE.right + 1, BASE.center, RGBA.line, RGBA.line.a);
    outLineMsg(BASE.left - 1, 101, BASE.right + 1, 101, RGBA.line, RGBA.line.a3);
    outLineMsg(BASE.left - 1, 120, BASE.right + 1, 120, RGBA.line, RGBA.line.a2);
    outLineMsg(BASE.left - 1, 140, BASE.right + 1, 140, RGBA.line, RGBA.line.a3);
    outLineMsg(BASE.left - 1, BASE.bottom, BASE.right + 1, BASE.bottom, RGBA.line, RGBA.line.a);
}

/**
 * output line draw message for lcd object to the outlet 0
 * @param {number} left horizonal offset of beggining endpoint
 * @param {number} top vertical offset of beggining endpoint
 * @param {number} right horizonal offset of finishing endpoint
 * @param {number} bottom vertical offset of finishing endpoint
 * @param {color} color {attr, r, g, b, a}
 * @param {number} alpha alpha value [0-255]
 */
function outLineMsg(left, top, right, bottom, color, alpha){
    outlet(0, 'linesegment', left, top, right, bottom, color.r, color.g, color.b, alpha);
}

/**
 * output rectangle draw message for lcd object to the outlet 0
 * @param {number} left left position
 * @param {number} top top position
 * @param {number} right right position
 * @param {number} bottom bottom position
 * @param {any} color {attr, r, g, b, a}
 * @param {number} alpha alpha value [0-255]
 */
function outRectMsg(left, top, right, bottom, color, alpha){
    outlet(0, 'paintrect', left, top, right, bottom, color.r, color.g, color.b, alpha);
}
