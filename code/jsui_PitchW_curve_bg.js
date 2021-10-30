/**
 * @fileoverview background jsui script for PitchW curve Max for Live device
 * @version 1.0.0 (10, October, 2021)
 * @author h1data
 */

// global parameters
autowatch = 1;
inlets = 1;
outlets = 0;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
mgraphics.redraw();

/** initial color settings
 *  attr: attribute name sent from live.colors object
 */
var COLORS = {
    bg: { attr: 'lcd_bg', r: 0.0941176, g: 0.1176471, b: 0.137255 },
    line: { attr: 'lcd_frame', r: 0.509804, g: 0.5490196, b: 0.5882353, a: 1.0, a2: 0.75, a3: 0.5 }
};

/** @const base postion */
var POSITION = {
  left: 1,
  width: 19,
  top: [2, 22, 42, 61, 81, 101, 120, 140, 160],
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
    for (var i in COLORS) {
        if(COLORS[i].attr === attr) {
            COLORS[i].r = r;
            COLORS[i].g = g;
            COLORS[i].b = b;
        }
    }
    mgraphics.redraw();
}

// functions called from local

/**
 * redraw every shapes
 */
paint.local = 1;
function paint() {
  with (mgraphics) {
    set_source_rgb(COLORS.bg.r, COLORS.bg.g, COLORS.bg.b);
    rectangle(0, 0, 21, 163);
    fill();
    
    set_source_rgba(COLORS.line.r, COLORS.line.g, COLORS.line.b, COLORS.line.a);
    rectangle(POSITION.left, POSITION.top[0], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[4], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[8], POSITION.width, 1);
    fill();

    set_source_rgba(COLORS.line.r, COLORS.line.g, COLORS.line.b, COLORS.line.a2);
    rectangle(POSITION.left, POSITION.top[2], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[6], POSITION.width, 1);
    fill();

    set_source_rgba(COLORS.line.r, COLORS.line.g, COLORS.line.b, COLORS.line.a3);
    rectangle(POSITION.left, POSITION.top[1], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[3], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[5], POSITION.width, 1);
    rectangle(POSITION.left, POSITION.top[7], POSITION.width, 1);
    fill();
  }
}
