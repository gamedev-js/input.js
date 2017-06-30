
/*
 * input.js v1.1.4
 * (c) 2017 @Johnny Wu
 * Released under the MIT License.
 */

var Input = (function () {
'use strict';

var KEY_NONE = 0;
var KEY_DOWN = 1;
var KEY_PRESSING = 2;
var KEY_UP = 3;

var _dragMask = null;

var Input = function Input (element, opts) {
  var this$1 = this;

  opts = opts || {};

  if (!_dragMask && opts.useMask) {
    _dragMask = document.createElement('div');
    _dragMask.classList.add('drag-mask');
    _dragMask.style.position = 'fixed';
    _dragMask.style.zIndex = '9999';
    _dragMask.style.top = '0';
    _dragMask.style.right = '0';
    _dragMask.style.bottom = '0';
    _dragMask.style.left = '0';
    _dragMask.oncontextmenu = function () { return false; };
  }

  this._opts = opts;
  this._element = element || document.body;
  this._lastTime = 0;
  this._globalEventInstalled = false;

  // mouse internal states
  this._pointerLocked = false;
  this._mouseGrabbed = false;

  this._bcr = element.getBoundingClientRect();

  // the mouse state
  this._mouse = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    prevX: 0,
    prevY: 0,

    // mouse wheel (delta)
    scrollX: 0,
    scrollY: 0,

    // buttons
    left: KEY_NONE,
    right: KEY_NONE,
    middle: KEY_NONE,
  };

  // the keyboard state
  this._keyboard = {
    // key-name: key-state (0: none, 1: down, 2: press, 3: up)
  };

  // mousemove
  this._mousemoveHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    this$1._mouse.dx = event.movementX;
    this$1._mouse.dy = event.movementY;

    if (this$1._pointerLocked) {
      this$1._mouse.x += event.movementX;
      this$1._mouse.y += event.movementY;
    } else {
      this$1._mouse.x = event.clientX - this$1._bcr.left;
      this$1._mouse.y = event.clientY - this$1._bcr.top;
    }
  };

  // mousewheel
  this._mousewheelHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    this$1._mouse.scrollX = event.deltaX;
    this$1._mouse.scrollY = event.deltaY;
  };

  // mousedown
  this._mousedownHandle = function (event) {
    // NOTE: this will prevent mouse enter the text selection state.
    event.preventDefault();
    event.stopPropagation();

    if (this$1._opts.lock) {
      this$1._lock(true);
    }

    this$1._installGlobalEvents();
    this$1._element.focus();

    // handle mouse button
    switch (event.button) {
      // left mouse down
      case 0:
        // NOTE: do not reset KEY_DOWN when it already pressed
        if (this$1._mouse.left !== KEY_PRESSING) {
          this$1._mouse.left = KEY_DOWN;
        }
        break;

      // middle mouse down
      case 1:
        // NOTE: do not reset KEY_DOWN when it already pressed
        if (this$1._mouse.middle !== KEY_PRESSING) {
          this$1._mouse.middle = KEY_DOWN;
        }
        break;

      // right mouse down
      case 2:
        // NOTE: do not reset KEY_DOWN when it already pressed
        if (this$1._mouse.right !== KEY_PRESSING) {
          this$1._mouse.right = KEY_DOWN;
        }
        break;
    }
  };

  // mouseup
  this._mouseupHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    // reset mouse position
    this$1._mouse.dx = event.movementX;
    this$1._mouse.dy = event.movementY;
    this$1._mouse.prevX = this$1._mouse.x = event.clientX - this$1._bcr.left;
    this$1._mouse.prevX = this$1._mouse.y = event.clientY - this$1._bcr.top;

    // handle mouse button
    switch (event.button) {
      // left mouse down
      case 0:
        this$1._mouse.left = KEY_UP;
        break;

      // middle mouse down
      case 1:
        this$1._mouse.middle = KEY_UP;
        break;

      // right mouse down
      case 2:
        this$1._mouse.right = KEY_UP;
        break;
    }
  };

  // mouseenter
  this._mouseenterHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    this$1._mouse.dx = 0.0;
    this$1._mouse.dy = 0.0;
    this$1._mouse.prevX = this$1._mouse.x = event.clientX - this$1._bcr.left;
    this$1._mouse.prevX = this$1._mouse.y = event.clientY - this$1._bcr.top;
  };

  // mouseleave
  this._mouseleaveHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (this$1._mouseGrabbed) {
      return;
    }

    this$1._uninstallGlobalEvents();

    this$1._mouse.dx = event.movementX;
    this$1._mouse.dy = event.movementY;
    this$1._mouse.prevX = this$1._mouse.x = event.clientX - this$1._bcr.left;
    this$1._mouse.prevX = this$1._mouse.y = event.clientY - this$1._bcr.top;
  };

  // keydown
  this._keydownHandle = function (event) {
    event.stopPropagation();

    // NOTE: do not reset KEY_DOWN when it already pressed
    if ( this$1._keyboard[event.key] !== KEY_PRESSING ) {
      this$1._keyboard[event.key] = KEY_DOWN;
    }
  };

  // keyup
  this._keyupHandle = function (event) {
    event.stopPropagation();

    this$1._keyboard[event.key] = KEY_UP;
  };

  // contextmenu
  this._contextmenuHandle = function (event) {
    event.preventDefault();
    event.stopPropagation();
  };

  this._registerEvents();
};

var prototypeAccessors = { mouseX: {},mouseY: {},mouseDeltaX: {},mouseDeltaY: {},mouseScrollX: {},mouseScrollY: {} };

Input.prototype.destroy = function destroy () {
  this._element.removeEventListener('mousedown', this._mousedownHandle);
  this._element.removeEventListener('mouseenter', this._mouseenterHandle);
  this._element.removeEventListener('mouseleave', this._mouseleaveHandle);
  this._element.removeEventListener('mousemove', this._mousemoveHandle);
  this._element.removeEventListener('mousewheel', this._mousewheelHandle, { passive: true });
  this._element.removeEventListener('keydown', this._keydownHandle);
  this._element.removeEventListener('keyup', this._keyupHandle);

  this._element.removeEventListener('contextmenu', this._contextmenuHandle);

  this._uninstallGlobalEvents();
};

Input.prototype._registerEvents = function _registerEvents () {
  this._element.addEventListener('mousedown', this._mousedownHandle);
  this._element.addEventListener('mouseenter', this._mouseenterHandle);
  this._element.addEventListener('mouseleave', this._mouseleaveHandle);
  this._element.addEventListener('mousemove', this._mousemoveHandle);
  this._element.addEventListener('mousewheel', this._mousewheelHandle, { passive: false });
  this._element.addEventListener('keydown', this._keydownHandle);
  this._element.addEventListener('keyup', this._keyupHandle);

  this._element.addEventListener('contextmenu', this._contextmenuHandle);
};

Input.prototype._installGlobalEvents = function _installGlobalEvents () {
  if (this._globalEventInstalled) {
    return;
  }

  document.addEventListener('mouseup', this._mouseupHandle);
  document.addEventListener('mousemove', this._mousemoveHandle);
  document.addEventListener('mousewheel', this._mousewheelHandle, { passive: true });

  if (this._opts.useMask) {
    _dragMask.style.cursor = this._opts.maskCursor || 'default';
    document.body.appendChild(_dragMask);
  }

  this._globalEventInstalled = true;
};

Input.prototype._uninstallGlobalEvents = function _uninstallGlobalEvents () {
  if (!this._globalEventInstalled) {
    return;
  }

  // if we have mouse key pressed, skip it
  if (
    (this._mouse.left !== KEY_NONE && this._mouse.left !== KEY_UP) ||
    (this._mouse.right !== KEY_NONE && this._mouse.right !== KEY_UP) ||
    (this._mouse.middle !== KEY_NONE && this._mouse.middle !== KEY_UP)
  ) {
    return;
  }

  // unlock mouse here
  this._lock(false);

  // if we are grabbing mouse, skip it
  if (this._mouseGrabbed) {
    return;
  }

  document.removeEventListener('mouseup', this._mouseupHandle);
  document.removeEventListener('mousemove', this._mousemoveHandle);
  document.removeEventListener('mousewheel', this._mousewheelHandle, { passive: true });

  if (this._opts.useMask) {
    _dragMask.remove();
  }

  this._globalEventInstalled = false;
};

// NOTE: in web-browser, requestPointerLock only works in mousedown event
Input.prototype._lock = function _lock (locked) {
  if (locked) {
    if (this._pointerLocked) {
      return;
    }

    if (this._element.requestPointerLock) {
      this._element.requestPointerLock();
      this._pointerLocked = true;
    }

    return;
  } else {
    if (!this._pointerLocked) {
      return;
    }

    if (document.exitPointerLock) {
      document.exitPointerLock();
      this._pointerLocked = false;
    }
  }
};

/**
 * @property {number} mouseX
 */
prototypeAccessors.mouseX.get = function () {
  return this._mouse.x;
};

/**
 * @property {number} mouseY
 */
prototypeAccessors.mouseY.get = function () {
  return this._mouse.y;
};

/**
 * @property {number} mouseDeltaX
 */
prototypeAccessors.mouseDeltaX.get = function () {
  return this._mouse.dx;
};

/**
 * @property {number} mouseDeltaY
 */
prototypeAccessors.mouseDeltaY.get = function () {
  return this._mouse.dy;
};

/**
 * @property {number} mouseScrollX
 */
prototypeAccessors.mouseScrollX.get = function () {
  return this._mouse.scrollX;
};

/**
 * @property {number} mouseScrollY
 */
prototypeAccessors.mouseScrollY.get = function () {
  return this._mouse.scrollY;
};

/**
 * @method reset
 *
 * Reset the input states.
 * NOTE: you should call this at the end of your frame.
 */
Input.prototype.reset = function reset () {
    var this$1 = this;

  // update mouse states
  this._mouse.prevX = this._mouse.x;
  this._mouse.prevY = this._mouse.y;

  this._mouse.dx = 0;
  this._mouse.dy = 0;

  this._mouse.scrollX = 0;
  this._mouse.scrollY = 0;

  if (this._mouse.left === KEY_DOWN) {
    this._mouse.left = KEY_PRESSING;
  } else if (this._mouse.left === KEY_UP) {
    this._mouse.left = KEY_NONE;
  }

  if (this._mouse.middle === KEY_DOWN) {
    this._mouse.middle = KEY_PRESSING;
  } else if (this._mouse.middle === KEY_UP) {
    this._mouse.middle = KEY_NONE;
  }

  if (this._mouse.right === KEY_DOWN) {
    this._mouse.right = KEY_PRESSING;
  } else if (this._mouse.right === KEY_UP) {
    this._mouse.right = KEY_NONE;
  }

  // update keyboard states
  for (var name in this$1._keyboard) {
    var state = this$1._keyboard[name];
    if ( state === KEY_DOWN ) {
      this$1._keyboard[name] = KEY_PRESSING;
    } else if ( state === KEY_UP ) {
      this$1._keyboard[name] = KEY_NONE;
    }
  }

  // check if uninstall global events
  this._uninstallGlobalEvents();
};

/**
 * @method resize
 *
 * Update cached bounding client size.
 */
Input.prototype.resize = function resize () {
  this._bcr = this._element.getBoundingClientRect();
};

/**
 * @method grabMouse
 * @param {boolean} grabbed
 *
 * Keep tracing mouse move event when mouse leave the target element.
 */
Input.prototype.grabMouse = function grabMouse (grabbed) {
  this._mouseGrabbed = grabbed;

  if (grabbed) {
    this._installGlobalEvents();
  } else {
    this._uninstallGlobalEvents();
  }
};

/**
 * @method mousedown
 * @param {string} name - 'left', 'right' or 'middle'
 */
Input.prototype.mousedown = function mousedown (name) {
  var btn = this._mouse[name];
  if (btn !== undefined) {
    return btn === KEY_DOWN;
  }

  return false;
};

/**
 * @method mousepress
 * @param {string} name - 'left', 'right' or 'middle'
 */
Input.prototype.mousepress = function mousepress (name) {
  var btn = this._mouse[name];
  if (btn !== undefined) {
    return btn === KEY_DOWN || btn === KEY_PRESSING;
  }

  return false;
};

/**
 * @method mouseup
 * @param {string} name - 'left', 'right' or 'middle'
 */
Input.prototype.mouseup = function mouseup (name) {
  var btn = this._mouse[name];
  if (btn !== undefined) {
    return btn === KEY_UP;
  }

  return false;
};

/**
 * @method keydown
 * @param {string} name
 */
Input.prototype.keydown = function keydown (name) {
  return this._keyboard[name] === KEY_DOWN;
};

/**
 * @method keyup
 * @param {string} name
 */
Input.prototype.keyup = function keyup (name) {
  return this._keyboard[name] === KEY_UP;
};

/**
 * @method keypress
 * @param {string} name
 */
Input.prototype.keypress = function keypress (name) {
  return this._keyboard[name] === KEY_DOWN ||
    this._keyboard[name] === KEY_PRESSING;
};

Object.defineProperties( Input.prototype, prototypeAccessors );

return Input;

}());
//# sourceMappingURL=input.dev.js.map
