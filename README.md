## Input States

Update input states every frame.

## Install

```bash
npm install input.js
```

## Usage

```javascript
  let input = new Input();

  function animate() {
    if (input.keydown('w')) {
      console.log('hello world');
    }

    input.reset();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
```

## Documentation

TODO

## TODO

 - input.mouseclick(name, downupSpan, dragDistance)
 - input.mouseclicks(name, clickCount, downupSpan, clickSpan, dragDistance)
 - input.keyclick(name, downupSpan, dragDistance)
 - input.keyclicks(name, clickCount, downupSpan, clickSpan, dragDistance)