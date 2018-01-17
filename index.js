import { LinkedArray, RecyclePool } from 'memop';

const KEY_NONE = 0;
const KEY_DOWN = 1;
const KEY_PRESSING = 2;
const KEY_UP = 3;

const TOUCH_START = 0;
const TOUCH_PRESSING = 1;
const TOUCH_END = 2;
const TOUCH_CANCEL = 3;

let _dragMask = null;
let _phases = [
  'start',
  'pressing',
  'end',
  'cancel'
];

let _states = [
  'none',
  'down',
  'pressing',
  'up',
];

export default class Input {
  /**
   * @method constructor
   * @param {HTMLElement} [element]
   * @param {object} [opts]
   * @param {boolean} [opts.enabled] - enable input. default is true
   * @param {boolean} [opts.lock] - lock cursor when mouse down. default is false.
   * @param {boolean} [opts.useMask] - use drag mask (for prevent cursor changes).
   * @param {string} [opts.maskCursor] - the cursor for drag mask.
   * @param {string} [opts.invertY] - invert Y coordinate (start from bottom-left instead)
   */
  constructor(element, opts) {
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

    this._element = element || document.body;

    // setup options

    this._enabled = true;
    if (opts.enabled !== undefined) {
      this._enabled = opts.enabled;
    }

    this._lock = false;
    if (opts.lock !== undefined) {
      this._lock = opts.lock;
    }

    this._useMask = false;
    if (opts.useMask !== undefined) {
      this._useMask = opts.useMask;
    }

    this._maskCursor = 'default';
    if (opts.maskCursor !== undefined) {
      this._maskCursor = opts.maskCursor;
    }

    this._invertY = false;
    if (opts.invertY !== undefined) {
      this._invertY = opts.invertY;
    }

    //
    let ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
      this._hasTouch = true;
    }

    // mouse internal states
    this._globalEventInstalled = false;
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
    this._keys = new LinkedArray(() => {
      return {
        _next: null,
        _prev: null,
        _state: 0,
        key: '',
        get state () {
          return _states[this._state];
        }
      };
    }, 100);

    //the touch state
    this._touches = new RecyclePool(() => {
      return {
        id: -1, // touch.identifier
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        prevX: 0,
        prevY: 0,
        get phase() {
          return _phases[this._phase];
        },
        _phase: -1, // 0: START, 1: PRESSING, 2: END
      };
    }, 16);

    // mousemove
    this._mousemoveHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      this._mouse.dx = event.movementX;
      this._mouse.dy = event.movementY;

      if (this._pointerLocked) {
        this._mouse.x += event.movementX;
        if (this._invertY) {
          this._mouse.y -= event.movementY;
        } else {
          this._mouse.y += event.movementY;
        }
      } else {
        this._mouse.x = this._calcOffsetX(event.clientX);
        this._mouse.y = this._calcOffsetY(event.clientY);
      }
    };

    // mousewheel
    this._mousewheelHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      this._mouse.scrollX = event.deltaX;
      this._mouse.scrollY = event.deltaY;
    };

    // mousedown
    this._mousedownHandle = event => {
      // NOTE: this will prevent mouse enter the text selection state.
      event.preventDefault();
      event.stopPropagation();

      if (this._lock) {
        this._lockPointer(true);
      }

      this._installGlobalEvents();
      this._element.focus();

      // handle mouse button
      switch (event.button) {
        // left mouse down
        case 0:
          // NOTE: do not reset KEY_DOWN when it already pressed
          if (this._mouse.left !== KEY_PRESSING) {
            this._mouse.left = KEY_DOWN;
          }
          break;

        // middle mouse down
        case 1:
          // NOTE: do not reset KEY_DOWN when it already pressed
          if (this._mouse.middle !== KEY_PRESSING) {
            this._mouse.middle = KEY_DOWN;
          }
          break;

        // right mouse down
        case 2:
          // NOTE: do not reset KEY_DOWN when it already pressed
          if (this._mouse.right !== KEY_PRESSING) {
            this._mouse.right = KEY_DOWN;
          }
          break;
      }
    };

    // mouseup
    this._mouseupHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      // reset mouse position
      this._mouse.dx = event.movementX;
      this._mouse.dy = event.movementY;
      this._mouse.prevX = this._mouse.x = this._calcOffsetX(event.clientX);
      this._mouse.prevY = this._mouse.y = this._calcOffsetY(event.clientY);

      // handle mouse button
      switch (event.button) {
        // left mouse up
        case 0:
          this._mouse.left = KEY_UP;
          break;

        // middle mouse up
        case 1:
          this._mouse.middle = KEY_UP;
          break;

        // right mouse up
        case 2:
          this._mouse.right = KEY_UP;
          break;
      }
    };

    // mouseenter
    this._mouseenterHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      this._mouse.dx = 0.0;
      this._mouse.dy = 0.0;
      this._mouse.prevX = this._mouse.x = this._calcOffsetX(event.clientX);
      this._mouse.prevY = this._mouse.y = this._calcOffsetY(event.clientY);
    };

    // mouseleave
    this._mouseleaveHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      if (this._mouseGrabbed) {
        return;
      }

      this._uninstallGlobalEvents();

      this._mouse.dx = event.movementX;
      this._mouse.dy = event.movementY;
      this._mouse.prevX = this._mouse.x = this._calcOffsetX(event.clientX);
      this._mouse.prevY = this._mouse.y = this._calcOffsetY(event.clientY);
    };

    // keydown
    this._keydownHandle = event => {
      event.stopPropagation();

      let iter = this._keys.head;
      while (iter) {
        if (iter.key === event.key) {
          break;
        }
        iter = iter._next;
      }

      // NOTE: do not reset KEY_DOWN when it already pressed
      if (iter && iter._state === KEY_PRESSING) {
        return;
      }

      if (!iter) {
        iter = this._keys.add();
      }
      iter.key = event.key;
      iter._state = KEY_DOWN;
    };

    // keyup
    this._keyupHandle = event => {
      event.stopPropagation();

      let iter = this._keys.head;
      while (iter) {
        if (iter.key === event.key) {
          break;
        }
        iter = iter._next;
      }

      if (iter) {
        this._keys.remove(iter);
      }

      iter = this._keys.add();
      iter.key = event.key;
      iter._state = KEY_UP;
    };

    // touchstart
    this._touchstartHandle = event => {
      event.preventDefault();

      for (let i = 0; i < event.changedTouches.length; i++) {
        let changedTouch = event.changedTouches[i];
        let touch = this._touches.add();

        touch.id = changedTouch.identifier;
        touch._phase = TOUCH_START;
        touch.x = this._calcOffsetX(changedTouch.clientX);
        touch.y = this._calcOffsetY(changedTouch.clientY);
        touch.dx = 0;
        touch.dy = 0;
        touch.prevX = 0;
        touch.prevY = 0;
      }
    };

    // touchmove
    this._touchmoveHandle = event => {
      event.preventDefault();

      for (let i = 0; i < this._touches.length; i++) {
        for (let j = 0; j < event.changedTouches.length; j++) {
          let touch = this._touches.data[i];
          let changedTouch = event.changedTouches[j];

          if (touch.id === changedTouch.identifier) {
            touch._phase = TOUCH_PRESSING;
            touch.x = this._calcOffsetX(changedTouch.clientX);
            touch.y = this._calcOffsetY(changedTouch.clientY);
            touch.dx = touch.x - touch.prevX;
            touch.dy = touch.y - touch.prevY;
          }
        }
      }
    };

    // touchend
    this._touchendHandle = event => {
      event.preventDefault();

      for (let i = 0; i < this._touches.length; i++) {
        for (let j = 0; j < event.changedTouches.length; j++) {
          let touch = this._touches.data[i];
          let changedTouch = event.changedTouches[j];

          if (touch.id === changedTouch.identifier) {
            touch._phase = TOUCH_END;
            touch.prevX = touch.x = this._calcOffsetX(changedTouch.clientX);
            touch.prevY = touch.y = this._calcOffsetY(changedTouch.clientY);
            touch.dx = 0;
            touch.dy = 0;
          }
        }
      }
    };

    // touchcancel
    this._touchcancelHandle = event => {
      event.preventDefault();

      for (let i = 0; i < this._touches.length; i++) {
        for (let j = 0; j < event.changedTouches.length; j++) {
          let touch = this._touches.data[i];
          let changedTouch = event.changedTouches[j];

          if (touch.id === changedTouch.identifier) {
            touch._phase = TOUCH_CANCEL;
            touch.prevX = touch.x = this._calcOffsetX(changedTouch.clientX);
            touch.prevY = touch.y = this._calcOffsetY(changedTouch.clientY);
            touch.dx = 0;
            touch.dy = 0;
          }
        }
      }
    };

    // contextmenu
    this._contextmenuHandle = event => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (this._enabled) {
      this._registerEvents();
    }
  }

  destroy() {
    this._element.removeEventListener('mousedown', this._mousedownHandle);
    this._element.removeEventListener('mouseenter', this._mouseenterHandle);
    this._element.removeEventListener('mouseleave', this._mouseleaveHandle);
    this._element.removeEventListener('mousemove', this._mousemoveHandle);
    this._element.removeEventListener('mousewheel', this._mousewheelHandle, { passive: true });
    this._element.removeEventListener('keydown', this._keydownHandle);
    this._element.removeEventListener('keyup', this._keyupHandle);
    this._element.removeEventListener("touchstart", this._touchstartHandle);
    this._element.removeEventListener("touchend", this._touchendHandle);
    this._element.removeEventListener("touchcancel", this._touchcancelHandle);
    this._element.removeEventListener("touchmove", this._touchmoveHandle);

    this._element.removeEventListener('contextmenu', this._contextmenuHandle);

    this._uninstallGlobalEvents();
  }

  _registerEvents() {
    this._element.addEventListener('mousedown', this._mousedownHandle);
    this._element.addEventListener('mouseenter', this._mouseenterHandle);
    this._element.addEventListener('mouseleave', this._mouseleaveHandle);
    this._element.addEventListener('mousemove', this._mousemoveHandle);
    this._element.addEventListener('mousewheel', this._mousewheelHandle, { passive: false });
    this._element.addEventListener('keydown', this._keydownHandle);
    this._element.addEventListener('keyup', this._keyupHandle);
    this._element.addEventListener("touchstart", this._touchstartHandle, false);
    this._element.addEventListener("touchend", this._touchendHandle, false);
    this._element.addEventListener("touchcancel", this._touchcancelHandle, false);
    this._element.addEventListener("touchmove", this._touchmoveHandle, false);

    this._element.addEventListener('contextmenu', this._contextmenuHandle);
  }

  _installGlobalEvents() {
    if (this._globalEventInstalled) {
      return;
    }

    document.addEventListener('mouseup', this._mouseupHandle);
    document.addEventListener('mousemove', this._mousemoveHandle);
    document.addEventListener('mousewheel', this._mousewheelHandle, { passive: true });

    if (this._useMask) {
      _dragMask.style.cursor = this._maskCursor || 'default';
      document.body.appendChild(_dragMask);
    }

    this._globalEventInstalled = true;
  }

  _uninstallGlobalEvents() {
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
    this._lockPointer(false);

    // if we are grabbing mouse, skip it
    if (this._mouseGrabbed) {
      return;
    }

    document.removeEventListener('mouseup', this._mouseupHandle);
    document.removeEventListener('mousemove', this._mousemoveHandle);
    document.removeEventListener('mousewheel', this._mousewheelHandle, { passive: true });

    if (this._useMask) {
      _dragMask.remove();
    }

    this._globalEventInstalled = false;
  }

  // NOTE: in web-browser, requestPointerLock only works in mousedown event
  _lockPointer(locked) {
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
  }

  _calcOffsetX (clientX) {
    return clientX - this._bcr.left;
  }

  _calcOffsetY (clientY) {
    if (this._invertY) {
      return this._bcr.height - (clientY - this._bcr.top);
    }

    return clientY - this._bcr.top;
  }

  /**
   * @property {boolean} enabled
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(val) {
    if (this._enabled !== val) {
      this._enabled = val;

      if (this._enabled) {
        this._registerEvents();
        if (this._mouseGrabbed) {
          this._installGlobalEvents();
        }
      } else {
        this.destroy();
      }
    }
  }

  /**
   * @property {boolean} hasTouch
   */
  get hasTouch() {
    return this._hasTouch;
  }

  /**
   * @property {number} mouseX
   */
  get mouseX() {
    return this._mouse.x;
  }

  /**
   * @property {number} mouseY
   */
  get mouseY() {
    return this._mouse.y;
  }

  /**
   * @property {number} mouseDeltaX
   */
  get mouseDeltaX() {
    return this._mouse.dx;
  }

  /**
   * @property {number} mouseDeltaY
   */
  get mouseDeltaY() {
    return this._mouse.dy;
  }

  /**
   * @property {number} mousePrevX
   */
  get mousePrevX() {
    return this._mouse.prevX;
  }

  /**
   * @property {number} mousePrevY
   */
  get mousePrevY() {
    return this._mouse.prevY;
  }

  /**
   * @property {number} mouseScrollX
   */
  get mouseScrollX() {
    return this._mouse.scrollX;
  }

  /**
   * @property {number} mouseScrollY
   */
  get mouseScrollY() {
    return this._mouse.scrollY;
  }

  /**
   * @property {number} mouseButtons - mouse buttons in pressing states
   */
  get mouseButtons() {
    let buttons = 0;

    let btn = this._mouse.left;
    if (btn === KEY_DOWN || btn === KEY_PRESSING) {
      buttons |= 1;
    }

    btn = this._mouse.right;
    if (btn === KEY_DOWN || btn === KEY_PRESSING) {
      buttons |= 2;
    }

    btn = this._mouse.middle;
    if (btn === KEY_DOWN || btn === KEY_PRESSING) {
      buttons |= 4;
    }

    return buttons;
  }

  /**
   * @property {number} touchCount
   */
  get touchCount() {
    return this._touches.length;
  }

  /**
   * @property {boolean} hasKeyDown
   */
  get hasKeyDown() {
    let iter = this._keys.head;
    while (iter) {
      if (iter._state === KEY_DOWN) {
        return true;
      }
    }
    return false;
  }

  /**
   * @property {boolean} hasKeyUp
   */
  get hasKeyUp() {
    let iter = this._keys.head;
    while (iter) {
      if (iter._state === KEY_UP) {
        return true;
      }
    }
    return false;
  }

  /**
   * @property {boolean} hasMouseDown
   */
  get hasMouseDown() {
    if (
      this._mouse.left === KEY_DOWN ||
      this._mouse.middle === KEY_DOWN ||
      this._mouse.right === KEY_DOWN
    ) {
      return true;
    }

    return false;
  }

  /**
   * @property {boolean} hasMouseUp
   */
  get hasMouseUp() {
    if (
      this._mouse.left === KEY_UP ||
      this._mouse.middle === KEY_UP ||
      this._mouse.right === KEY_UP
    ) {
      return true;
    }

    return false;
  }

  /**
   * @method getTouchInfo
   * @param {number} idx
   */
  getTouchInfo(idx) {
    return this._touches.data[idx];
  }

  /**
   * @method reset
   *
   * Reset the input states.
   * NOTE: you should call this at the end of your frame.
   */
  reset() {
    if (this._enabled === false) {
      return;
    }

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
    let iter = this._keys.head;
    let next = iter;
    while (next) {
      iter = next;
      next = iter._next;

      if (iter._state === KEY_DOWN) {
        iter._state = KEY_PRESSING;
      } else if (iter._state === KEY_UP) {
        this._keys.remove(iter);
      }
    }

    // update touch states
    for (let i = 0; i < this._touches.length; i++) {
      this._touches.data[i].prevX = this._touches.data[i].x;
      this._touches.data[i].prevY = this._touches.data[i].y;
      this._touches.data[i].dx = 0;
      this._touches.data[i].dy = 0;
      if (this._touches.data[i]._phase === TOUCH_START) {
        this._touches.data[i]._phase = TOUCH_PRESSING;
      }
      if (this._touches.data[i]._phase === TOUCH_END || this._touches.data[i]._phase === TOUCH_CANCEL) {
        this._touches.remove(i);
      }
    }

    // check if uninstall global events
    this._uninstallGlobalEvents();
  }

  /**
   * @method resize
   *
   * Update cached bounding client size.
   */
  resize() {
    this._bcr = this._element.getBoundingClientRect();
  }

  /**
   * @method grabMouse
   * @param {boolean} grabbed
   *
   * Keep tracing mouse move event when mouse leave the target element.
   */
  grabMouse(grabbed) {
    this._mouseGrabbed = grabbed;

    // NOTE: we can mark mouse grabbed, but don't register events for it.
    if (this._enabled === false) {
      return;
    }

    if (grabbed) {
      this._installGlobalEvents();
    } else {
      this._uninstallGlobalEvents();
    }
  }

  /**
   * @method mousedown
   * @param {string} name - 'left', 'right' or 'middle'
   */
  mousedown(name) {
    let btn = this._mouse[name];
    if (btn !== undefined) {
      return btn === KEY_DOWN;
    }

    return false;
  }

  /**
   * @method mousepress
   * @param {string} name - 'left', 'right' or 'middle'
   */
  mousepress(name) {
    let btn = this._mouse[name];
    if (btn !== undefined) {
      return btn === KEY_DOWN || btn === KEY_PRESSING;
    }

    return false;
  }

  /**
   * @method mouseup
   * @param {string} name - 'left', 'right' or 'middle'
   */
  mouseup(name) {
    let btn = this._mouse[name];
    if (btn !== undefined) {
      return btn === KEY_UP;
    }

    return false;
  }

  /**
   * @method keydown
   * @param {string} name
   */
  keydown(name) {
    let iter = this._keys.head;
    while (iter) {
      if (iter.key === name && iter._state === KEY_DOWN) {
        return true;
      }
      iter = iter._next;
    }

    return false;
  }

  /**
   * @method keyup
   * @param {string} name
   */
  keyup(name) {
    let iter = this._keys.head;
    while (iter) {
      if (iter.key === name && iter._state === KEY_UP) {
        return true;
      }
      iter = iter._next;
    }

    return false;
  }

  /**
   * @method keypress
   * @param {string} name
   */
  keypress(name) {
    let iter = this._keys.head;
    while (iter) {
      if (iter.key === name &&
        (iter._state === KEY_DOWN || iter._state === KEY_PRESSING)
      ) {
        return true;
      }
      iter = iter._next;
    }

    return false;
  }
}