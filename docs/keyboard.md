# Keyboard

## Methods

###  input.keydown(name), input.keypress(name), input.keyup(name)

  - `name` string - The name of the keyboard buttons.

Return the keyboard button state.

## Example:

**Keyboard button down**

```javascript
let input = new Input();

function animate() {
  
 if (input.keydown('w')) {
    console.log('key w down');
  }

  input.reset();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```