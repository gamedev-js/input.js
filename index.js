const KEY_NONE = 0;
const KEY_DOWN = 1;
const KEY_PRESSING = 2;
const KEY_UP = 3;

export default class Input {
  constructor (element, opts) {
    this._opts = opts;
    this._element = element || document.body;
    this._lastTime = 0;
    this._pointerLocked = false;

    // the mouse state
    this._mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      scrollX: 0,
      scrollY: 0,
      prevX: 0,
      prevY: 0,
    };

    // the keyboard state
    this._keyboard = {
      // key-name: key-state (0: none, 1: down, 2: press, 3: up)
    };

    // mousemove
    this._mousemoveHandle = event => {
      event.stopPropagation();

      if (this._pointerLocked) {
        this._mouse.x += event.movementX;
        this._mouse.y += event.movementY;
      } else {
        let bcr = this._element.getBoundingClientRect();
        this._mouse.x = event.clientX - bcr.left;
        this._mouse.y = event.clientY - bcr.top;
      }
    };

    // mousewheel
    this._mousewheelHandle = event => {
      event.stopPropagation();

      this._mouse.scrollX = event.deltaX;
      this._mouse.scrollY = event.deltaY;
    };

    // mousedown
    this._mousedownHandle = event => {
      event.stopPropagation();

      console.log('mousedown', event.button);
      console.log('mousedown', event.buttons);
    };

    // mouseup
    this._mouseupHandle = event => {
      event.stopPropagation();

      console.log('mouseup', event.button);
      console.log('mouseup', event.buttons);
    };

    this._registerEvents();
  }

  _registerEvents () {
    document.addEventListener('mousedown', this._mousedownHandle);
  }

  reset () {
    // update mouse states
    this._mouse.prevX = this._mouse.x;
    this._mouse.prevY = this._mouse.y;

    this._mouse.dx = 0;
    this._mouse.dy = 0;

    this._mouse.scrollX = 0;
    this._mouse.scrollY = 0;

    // update keyboard states
  }
}