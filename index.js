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

    this._mouseEnabled = false;

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
      if (!this._mouseEnabled) {
        return;
      }

      event.preventDefault();
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

      // left mouse down
      if (event.button === 0) {
        this._element.focus();
      }

      //
      if (document.body.requestPointerLock && !this._pointerLocked) {
        document.body.requestPointerLock();
        this._pointerLocked = true;
      }
    };

    // mouseup
    this._mouseupHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      //
      if ( document.exitPointerLock && this._pointerLocked ) {
        this._pointerLocked = false;
        document.exitPointerLock();
      }

      // DISABLE:
      // let bcr = this._element.getBoundingClientRect();
      // this._mouse.dx = event.movementX;
      // this._mouse.dy = event.movementY;
      // this._mouse.prevX = this._mouse.x = event.clientX - bcr.left;
      // this._mouse.prevX = this._mouse.y = event.clientY - bcr.top;
    };

    // mouseenter
    this._mouseenterHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      let bcr = this._element.getBoundingClientRect();

      this._mouseEnabled = true;
      this._mouse.dx = 0.0;
      this._mouse.dy = 0.0;
      this._mouse.prevX = this._mouse.x = event.clientX - bcr.left;
      this._mouse.prevX = this._mouse.y = event.clientY - bcr.top;
    };

    // mouseleave
    this._mouseleaveHandle = event => {
      event.preventDefault();
      event.stopPropagation();

      let bcr = this._element.getBoundingClientRect();

      this._mouseEnabled = false;
      this._mouse.dx = event.movementX;
      this._mouse.dy = event.movementY;
      this._mouse.prevX = this._mouse.x = event.clientX - bcr.left;
      this._mouse.prevX = this._mouse.y = event.clientY - bcr.top;
    };

    this._registerEvents();
  }

  _registerEvents () {
    this._element.addEventListener('mousedown', this._mousedownHandle);
    document.addEventListener('mouseup', this._mouseupHandle);
    this._element.addEventListener('mouseenter', this._mouseenterHandle);
    this._element.addEventListener('mouseleave', this._mouseleaveHandle);
    document.addEventListener('mousemove', this._mousemoveHandle);
  }

  get mouseX () {
    return this._mouse.x;
  }

  get mouseY () {
    return this._mouse.y;
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

  destroy () {
    this._element.removeEventListener('mousedown', this._mousedownHandle);
    document.removeEventListener('mouseup', this._mouseupHandle);
    this._element.removeEventListener('mouseenter', this._mouseenterHandle);
    this._element.removeEventListener('mouseleave', this._mouseleaveHandle);
    document.removeEventListener('mousemove', this._mousemoveHandle);
  }
}