# Touches

## Methods

###  input.getTouchInfo(idx)

  - `idx` number - The number of the acquired touch.

Find and return the idx-th touch.

## Properties

###  input.touchCount

  - `input.touchCount` number - The number of touches on the screen.

###  input.getTouchInfo(idx)

  - `input.getTouchInfo(idx).id` number - The identifier of the touch.
  - `input.getTouchInfo(idx).phase` number - The state of the touch(start,press,end).
  - `input.getTouchInfo(idx).x` number - X position of touch.
  - `input.getTouchInfo(idx).y` number - Y position of touch.
  - `input.getTouchInfo(idx).dx` number - The delta of x position compared with the previous frame.
  - `input.getTouchInfo(idx).dy` number - The delta of y position compared with the previous frame.
  - `input.getTouchInfo(idx).prevX` number - The previous x position of touch.
  - `input.getTouchInfo(idx).prevY` number - The previous y position of touch.

## Example:

**Get Touches Information**

```javascript
let input = new Input();

function animate() {
  for (let i = 0; i < input.touchCount; i++) {
    let touch = input.getTouchInfo(i);
    console.log('ID: ',touch.id);
    console.log('phase: ',touch.phase);
    console.log('x: ',touch.x);
    console.log('y: ',touch.y);
    console.log('dx: ',touch.dx);
    console.log('dy: ',touch.dy);
    console.log('prevX: ',touch.prevX);
    console.log('prevY: ',touch.prevY);
  }

  input.reset();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```