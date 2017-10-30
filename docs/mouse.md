# Mouse

## Methods

###  input.mousedown(name), input.mousepress(name), input.mouseup(name)

  - `name` string - The name of the mouse buttons('left', 'right' or 'middle').

Return the mouse button state.

## Properties

### mouse position

  - `input.mouseX` number - X position of mouse.
  - `input.mouseY` number - Y position of mouse.
  - `input.mouseDeltaX` number - The delta of x position compared with the previous frame.
  - `input.mouseDeltaY` number - The delta of y position compared with the previous frame.
  - `input.mousePrevX` number - The previous x position of mouse.
  - `input.mousePrevY` number - The previous y position of mouse.
  - `input.mouseScrollX` number - The scroll x position of mouse.
  - `input.mouseScrollY` number - The scroll y position of mouse.

## Example:

**Get mouse properties and state**

```javascript
let input = new Input();

function animate() {
  console.log('mouseX: ',input.mouseX);
  console.log('mouseY: ',input.mouseY);
  console.log('mouseDeltaX: ',input.mouseDeltaX);
  console.log('mouseDeltaY: ',input.mouseDeltaY);
  console.log('mousePrevX: ',input.mousePrevX);
  console.log('mousePrevX: ',input.mousePrevY);
  console.log('mouseScrollX: ',input.mouseScrollX);
  console.log('mouseScrollY: ',input.mouseScrollY);
  console.log('mouseScrollY: ',input.mouseScrollY);
  
  if (input.mousedown('left')) {
    console.log('left button down');
  }

  input.reset();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```