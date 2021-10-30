/**
 * @fileoverview jsui script for PitchW curve Max for Live device (main part)
 * @version 1.0.0 (30, October, 2021)
 * @author h1data
 */

// global parameters
autowatch = 1;
inlets = 1;
outlets = 1;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var pbPositionY = 81;    // the pitch bend position
var selection = null;    // from / to
var FROM = 0;
var TO = 1;
var isActive = 1;
var pMouseY;  // p5js-ish
var fromValue = 8192;
var toValue = 0;

var COLOR = {
  fg: [0.917647, 0.94902, 0.054902255],       // control_selection or lcd_control_fg
  inactive: [0.321569, 0.321569, 0.321569],   // control_fg_zombie or lcd_control_fg_zombie
  fg2: [0.427451, 0.843137, 1.],              // output_curve_outline_color
  a: 0.5,
  a2: 0.25,
};

/** (const) position for pitch bend indicator */
var RECT = {
  left: 2,          // left most
  top: 2,           // top most
  width: 17,        // width
  center: 81,       // the center
};

/** variable position for RANGE indicators */
var RANGE = {
  vLeft: 2,     // (const) left of left-side vertical line
  vRight: 18,   // (const) left of right-side vertical line
  hLeft: 3,     // (const) left of horizontal line
  hRight: 15,   // (const) left of horizontal line
  width: 3,     // (const) width of horizontal line
  height: 4,    // height of vertical lines
  top: 81,      // top most of range used for drawing pitch bend rect
  bottom: 160,  // bottom most of range used for drawing pitch bend rect
  from: {
    vTop: 81,   // top of vertical line 
    hTop: 81    // top of horizontal line
  },
  to: {
    vTop: 157,  // top of vertical line
    hTop: 160   // top of horizontal line
  }
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
 * @param attr attribute name of live.colors
 * @param r red
 * @param g green
 * @param b blue
 * @param a alpha (not used)
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
 * @param {Number} from 'From' pitch bend value
 */
function setFrom(from) {
  // post('setFrom', from, '\n');
  fromValue = Math.round(from) + 8192;
  outlet(0, 'from', fromValue);
  setRangePosition();
}

/**
 * set 'from' range indicator represents position from m4l GUI
 * @param {Number} from 'From' pitch bend value
 */
 function setTo(to) {
  // post('setTo', to, '\n');
  toValue = Math.round(to) + 8192;
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
    // TODO use fill_with_alpha
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
    rectangle(RANGE.hLeft, RANGE.from.hTop, RANGE.width, 1);
    rectangle(RANGE.hRight, RANGE.from.hTop, RANGE.width, 1);
    rectangle(RANGE.vLeft, RANGE.from.vTop, 1, RANGE.height);
    rectangle(RANGE.vRight, RANGE.from.vTop, 1, RANGE.height);
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
    rectangle(RANGE.hLeft, RANGE.to.hTop, RANGE.width, 1);
    rectangle(RANGE.hRight, RANGE.to.hTop, RANGE.width, 1);
    rectangle(RANGE.vLeft, RANGE.to.vTop, 1, RANGE.height);
    rectangle(RANGE.vRight, RANGE.to.vTop, 1, RANGE.height);
    fill();
  }
}

onclick.local = 1;
function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  // post('onclick', y, but, '\n');
  checkMouse(y);
  pMouseY = y;
  if (selection == null) return;
}

ondrag.local = 1;
function ondrag(x, y, but, cmd, shift, capslock, option, ctrl) {
  // post('ondrag', y, but, '\n');
  if (but) {
    if (selection == null) return;
    var dy = y - pMouseY;
    pMouseY = y;

    if (selection == FROM) {
      // 16383 / 158px -> 103.69
      fromValue = clip(shift ? fromValue - dy*0.25 : Math.round(fromValue - dy*103.69), 0, 16383);
      outlet(0, 'from', fromValue);
      outlet(0, 'numFrom', fromValue - 8192.0);
      setRangePosition();
    } else if (selection == TO) {
      toValue = clip(shift ? toValue - dy*0.25 : Math.round(toValue - dy*103.69), 0, 16383);
      outlet(0, 'to', toValue);
      outlet(0, 'numTo', toValue - 8192.0);
      setRangePosition();
    }
  } else {
    checkMouse(y);
    outlet(0, 'draw');
  }

  function clip(x, min, max) {
    return Math.min(Math.max(x, min), max);
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
  checkMouse(y);
  outlet(0, 'draw');
}

/**
 * check and decide which of range item to pick
 */
checkMouse.local = 1;
function checkMouse(y) {
  if (y <= (RANGE.to.hTop + 4) && y >= (RANGE.to.hTop - 4) ) {
    selection = TO;
  } else if (y <= (RANGE.from.hTop + 4) && y >= (RANGE.from.hTop - 4) ) {
    selection = FROM;
  } else {
    selection = null;
  }
}

/**
 * calculate position of ranges and redraw
 */
 setRangePosition.local = 1;
 function setRangePosition() {
   RANGE.from.hTop = getPositionY(fromValue);
   RANGE.to.hTop = getPositionY(toValue);
   var sub = Math.abs(RANGE.from.hTop - RANGE.to.hTop);
   RANGE.height = (sub >= 4) ? 4 : sub;
   if (fromValue > toValue) {
     RANGE.top = RANGE.from.hTop;
     RANGE.bottom = RANGE.to.hTop;
     RANGE.from.vTop = RANGE.from.hTop;
     RANGE.to.vTop = RANGE.to.hTop - RANGE.height + 1;
   } else {
     RANGE.top = RANGE.to.hTop;
     RANGE.bottom = RANGE.from.hTop;
     RANGE.from.vTop = RANGE.from.hTop - RANGE.height + 1;
     RANGE.to.vTop = RANGE.to.hTop;
   }
   outlet(0, 'draw');
 }
 