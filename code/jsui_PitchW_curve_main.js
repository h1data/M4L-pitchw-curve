/**
 * @fileoverview jsui script for PitchW curve Max for Live device (main part)
 * @version 1.4.0 July, 2025
 * @author h1data
 * @since 2021
 */

// global parameters
autowatch = 1;
inlets = 1;
outlets = 1;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// const
var FROM = 0;
var TO = 1;
var UNSIGNED_FULL = 16383;
var SIGNED_FULL = 8192;
var PATCHER_HEIGHT = 163;
// variables
var pbPositionY = 81;   // the pitch bend position
var selection = null;   // from / to
var isActive = 1;
var liveZoom = 1.0;
var cMouseX;            // X of Cursor position in screen
var cMouseY;            // Y of Cursor position in screen
var pMouseY;            // Y of Previous position in jsui
var fromValue = SIGNED_FULL;
var toValue = 0;
var isPrecise = false;  // true if shift + drag mode

var COLOR = {
  fg: [0.917647, 0.94902, 0.054902255],       // control_selection or lcd_control_fg
  inactive: [0.321569, 0.321569, 0.321569],   // control_fg_zombie or lcd_control_fg_zombie
  fg2: [0.427451, 0.843137, 1.],              // output_curve_outline_color
  a: 0.5,
  a2: 0.25,
};

/** @const position for pitch bend indicator */
var RECT = {
  left: 2,          // left most
  top: 2,           // top most
  width: 17,        // width
  center: 81,       // the center
};

/** variable position for RANGE indicators */
var RANGE = {
  /** @const left of left-side vertical line*/
  vLeft: 2,
  /** @const right of right-side vertical line*/
  vRight: 18,
  /** @const left of horizontal line */
  hLeft: 3,     
  /** @const right of horizontal line*/
  hRight: 15,
  /** width of horizontal line*/
  width: 3,
  /** height of vertical lines */
  height: 4,    
  /** top most of range used for drawing pitch bend rect */
  top: 81,
  /** bottom most of range used for drawing pitch bend rect */
  bottom: 160,
  /** dimension of FROM bracket */
  FROM: {
    /** @type {number} top of vertical line  */
    vTop: 81,
    /** @type {number} top of horizontal line */
    hTop: 81
  },
  /** dimension of TO bracket */
  TO: {
    /** @type {number} top of vertical line */
    vTop: 157,
    /** @type {number} top of horizontal line */
    hTop: 160
  },
  selectedTop: FROM.hTop
};

// functions called by Max messages

/**
 * set active status
 * @param {number} attr 1 or 0
 */
function active(attr) {
  isActive = attr;
  if(!isActive) pbPositionY = 81;
  outlet(0, 'draw');
}

/**
 * set color settings from live.colors
 * @param {string} attr attribute name of live.colors
 * @param {number} r red
 * @param {number} g green
 * @param {number} b blue
 * @param {number} a alpha (not used)
 */
function setColor(attr, r, g, b, a) {
  if (attr === 'control_selection' || attr === 'lcd_control_fg') {
    COLOR.fg = [r, g, b];
  } else if (attr === 'control_zombie' || attr === 'lcd_control_fg_zombie') {
    COLOR.inactive = [r, g, b];
  } else if (attr === 'value_arc') {
    COLOR.fg2 = [r*0.25 + 0.75, g*0.25 + 0.75, b*0.25 + 0.75];
  }
  outlet(0, 'draw');
}

/**
 * set 'from' range indicator represents position from m4l GUI
 * @param {number} from 'From' pitch bend value
 */
function setFrom(from) {
  fromValue = Math.round(from) + SIGNED_FULL;
  outlet(0, 'from', fromValue);
  setRangePosition();
}

/**
 * set 'from' range indicator represents position from m4l GUI
 * @param {number} from 'From' pitch bend value
 */
 function setTo(to) {
  toValue = Math.round(to) + SIGNED_FULL;
  outlet(0, 'to', toValue);
  setRangePosition();
}

function bang() {
  mgraphics.redraw();
}

/**
 * receiving pitch bend value
 * @param {number} pb the pitch bend value 
 */
function msg_int(pb) {
  pbPositionY = getPositionY(pb);
  outlet(0, 'draw');
}

// functions called from local

/**
 * redraw every shapes
 */
function paint() {
  drawPitchBend();
  drawRange();
}

/**
 * returns y position from pitch bend value
 * @param {number} value pitch bend value [0-16383]
 */
getPositionY.local = 1;
function getPositionY(value) {
  // 1.0 / 16383.0 * [160(bottom) - 2(top)] -> 0.0096441433
  return Math.round((16383.0 - value) * 0.0096441433 + RECT.top);
}

/**
 * draw rectangles represents pitch bend
 */
drawPitchBend.local = 1;
function drawPitchBend() {
  if (!isActive) return;
  with(mgraphics) {
    if (pbPositionY < RECT.center) {
      if (pbPositionY > RANGE.bottom || pbPositionY < RANGE.top) {
        // out of range
        set_source_rgba(COLOR.fg, COLOR.a2);
        rectangle(RECT.left, pbPositionY, RECT.width, RECT.center - pbPositionY + 1);
        fill();
      } else if (RANGE.bottom < RECT.center) {
        set_source_rgba(COLOR.fg, COLOR.a);
        rectangle(RECT.left, pbPositionY, RECT.width, RANGE.bottom - pbPositionY + 1);
        fill();
        set_source_rgba(COLOR.fg, COLOR.a2);
        rectangle(RECT.left, RANGE.bottom + 1, RECT.width, RECT.center - RANGE.bottom);
        fill();
      } else {
        set_source_rgba(COLOR.fg, COLOR.a);
        rectangle(RECT.left, pbPositionY, RECT.width, RECT.center - pbPositionY + 1);
        fill();
      }
    } else {
      if (pbPositionY > RANGE.bottom || pbPositionY < RANGE.top) {
        // out of range
        set_source_rgba(COLOR.fg, COLOR.a2);
        rectangle(RECT.left, RECT.center, RECT.width, pbPositionY - RECT.center + 1);
        fill();
      } else if (RANGE.top > RECT.center) {
        set_source_rgba(COLOR.fg, COLOR.a2);
        rectangle(RECT.left, RECT.center, RECT.width, RANGE.top - RECT.center);
        fill();
        set_source_rgba(COLOR.fg, COLOR.a);
        rectangle(RECT.left, RANGE.top, RECT.width, pbPositionY - RANGE.top + 1);
        fill();
      } else {
        set_source_rgba(COLOR.fg, COLOR.a);
        rectangle(RECT.left, RECT.center, RECT.width, pbPositionY - RECT.center + 1);
        fill();
      }
    }
  }
}

/**
 * draw RANGE indicators represents From-To values
 */
drawRange.local = 1;
function drawRange() {
  with (mgraphics) {
    if (isActive) {
      if (selection === FROM) {
        set_source_rgb(COLOR.fg2);
      } else {
        set_source_rgb(COLOR.fg);
      }
    } else {
      set_source_rgb(COLOR.inactive);
    }
    rectangle(RANGE.hLeft, RANGE.FROM.hTop, RANGE.width, 1);
    rectangle(RANGE.hRight, RANGE.FROM.hTop, RANGE.width, 1);
    rectangle(RANGE.vLeft, RANGE.FROM.vTop, 1, RANGE.height);
    rectangle(RANGE.vRight, RANGE.FROM.vTop, 1, RANGE.height);
    fill();
    if (isActive) {
      if (selection === TO) {
        set_source_rgb(COLOR.fg2);
      } else {
        set_source_rgb(COLOR.fg);
      }
    } else {
      set_source_rgb(COLOR.inactive);
    }
    rectangle(RANGE.hLeft, RANGE.TO.hTop, RANGE.width, 1);
    rectangle(RANGE.hRight, RANGE.TO.hTop, RANGE.width, 1);
    rectangle(RANGE.vLeft, RANGE.TO.vTop, 1, RANGE.height);
    rectangle(RANGE.vRight, RANGE.TO.vTop, 1, RANGE.height);
    fill();
  }
}

onclick.local = 1;
function onclick(x, y, button, cmd, shift, capslock, option, ctrl) {
  detectSelection(y);
  liveZoom = (patcher.wind.location[3] - patcher.wind.location[1]) / PATCHER_HEIGHT;
  cMouseX = x * liveZoom + patcher.wind.location[0];
  if (shift && !cmd) {
    pMouseY = 0;
  } else {
    pMouseY = y;
  }
  
  if (selection == null) return;
  max.message('hidecursor');
}

ondrag.local = 1;
function ondrag(x, y, button, cmd, shift, capslock, option, ctrl) {
  if (selection == null) return;
  if (button) {
    if (shift && !cmd) {
      if (!isPrecise) {
        isPrecise = true;
      } else {
        var dy = y - RANGE.selectedTop;
        if (dy == 0) return;
        dy = dy > 0 ? -1 : 1;
        if (selection == FROM) {
          setFromValue(fromValue + dy);
        } else {
          setToValue(toValue + dy);
        }
      }
      pupdate();
    } else {
      if (isPrecise) {
        isPrecise = false;
        pMouseY = RANGE.selectedTop;
        pupdate();
        return;
      }
      var dy = y - pMouseY;
      pMouseY = y;
      isPrecise = false;
      if (selection == FROM) {
        setFromValue(calcValue(cmd, shift, fromValue, dy, y));
      } else if (selection == TO) {
        setToValue(calcValue(cmd, shift, toValue, dy, y));
      }
    }
  } else {  // on released button
    detectSelection(y);
    outlet(0, 'draw');
    pupdate();
    max.message('showcursor');
  }

  function calcValue(cmd, shift, value, delta, pos) {
    // (129-1)steps / 158px -> 0.8101265823, 16383 / (129-1)steps -> 127.9921875
    if (shift && cmd) return clip(Math.round(UNSIGNED_FULL - Math.round(pos*0.8101265823) * 127.9921875), 0, UNSIGNED_FULL);

    // (25-1)steps / 158px -> 0.1518987342, 16383 / (25-1)steps -> 682.625
    if (cmd) return clip(Math.round(UNSIGNED_FULL - Math.round(pos*0.1518987342) * 682.625), 0, UNSIGNED_FULL);

    // 16383 / 158px -> 103.689873
    return clip(Math.round(UNSIGNED_FULL - pos * 103.689873), 0, UNSIGNED_FULL);
  }
  
  function clip(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setFromValue(value) {
    fromValue = value;
    outlet(0, 'from', fromValue);
    outlet(0, 'numFrom', fromValue - SIGNED_FULL);
    setRangePosition();
  }

  function setToValue(value) {
    toValue = value;
    outlet(0, 'to', toValue);
    outlet(0, 'numTo', toValue - SIGNED_FULL);
    setRangePosition();
  }

  function pupdate() {
     max.message('pupdate', cMouseX, Math.round(RANGE.selectedTop * liveZoom) + patcher.wind.location[1]);
  }
}

onidleout.local = 1;
function onidleout(x, y, but, cmd, shift, capslock, option, ctrl) {
  if (!but) {
    selection = null;
    outlet(0, 'draw');
  }
}

onidle.local = 1;
function onidle(x, y, but, cmd, shift, capslock, option, ctrl) {
  detectSelection(y);
  outlet(0, 'draw');
}

/**
 * check and decide which of range item to pick
 */
detectSelection.local = 1;
function detectSelection(y) {
  if (y <= (RANGE.TO.hTop + 4) && y >= (RANGE.TO.hTop - 4) ) {
    selection = TO;
    RANGE.selectedTop = RANGE.TO.hTop;
  } else if (y <= (RANGE.FROM.hTop + 4) && y >= (RANGE.FROM.hTop - 4) ) {
    selection = FROM;
    RANGE.selectedTop = RANGE.FROM.hTop;
  } else {
    selection = null;
  }
}

/**
 * calculate position of ranges and redraw
 */
 setRangePosition.local = 1;
 function setRangePosition() {
   RANGE.FROM.hTop = getPositionY(fromValue);
   RANGE.TO.hTop = getPositionY(toValue);
   var sub = Math.abs(RANGE.FROM.hTop - RANGE.TO.hTop);
   RANGE.height = (sub >= 4) ? 4 : sub;
   if (fromValue > toValue) {
     RANGE.top = RANGE.FROM.hTop;
     RANGE.bottom = RANGE.TO.hTop;
     RANGE.FROM.vTop = RANGE.FROM.hTop;
     RANGE.TO.vTop = RANGE.TO.hTop - RANGE.height + 1;
   } else {
     RANGE.top = RANGE.TO.hTop;
     RANGE.bottom = RANGE.FROM.hTop;
     RANGE.FROM.vTop = RANGE.FROM.hTop - RANGE.height + 1;
     RANGE.TO.vTop = RANGE.TO.hTop;
   }
   RANGE.selectedTop = selection == FROM ? RANGE.FROM.hTop : RANGE.TO.hTop;
   outlet(0, 'draw');
 }
 