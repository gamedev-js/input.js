'use strict';

const Input = require('../dist/input.js')

let el = document.createElement('div');
el.id = 'mouse';
el.style.width = '400px';
el.style.height = '300px';
el.tabIndex = -1;
document.body.appendChild(el);
let input = new Input(document.getElementById('mouse'));

suite(tap, 'input', t => {

  t.test('it should respond mousedown on left button', t => {
    el.focus();

    helper.mousedown(el, 'left');
    setTimeout(() => {
      t.equal(input.mousedown('left'), true);
      input.reset();
      t.equal(input.mousedown('left'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond mouseup on left button', t => {
    el.focus();

    helper.mouseup(el, 'left');
    setTimeout(() => {
      t.equal(input.mouseup('left'), true);
      input.reset();
      t.equal(input.mouseup('left'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond mousedown on right button', t => {
    el.focus();

    helper.mousedown(el, 'right');
    setTimeout(() => {
      t.equal(input.mousedown('right'), true);
      input.reset();
      t.equal(input.mousedown('right'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond mouseup on right button', t => {
    el.focus();

    helper.mouseup(el, 'right');
    setTimeout(() => {
      t.equal(input.mouseup('right'), true);
      input.reset();
      t.equal(input.mouseup('right'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond mousewheel', t => {
    el.focus();

    helper.mousewheel(el, null, 10);
    setTimeout(() => {
      t.equal(input.mouseScrollY, 10);
      input.reset();
      t.equal(input.mouseScrollY, 0);

      t.end();
    }, 100);
  });

  t.test('it should respond mousemove', { timeout: 0 }, t => {
    el.focus();

    helper.mousemove(
      el,
      'left',
      1000,
      `M0,0, L100,100`
    );
    let i = 0;

    let interval = setInterval(() => {
      t.equal(input.mouseDeltaX, 1);
      t.equal(input.mouseDeltaY, 1);
      input.reset();
      t.equal(input.mouseDeltaX, 0);
      t.equal(input.mouseDeltaY, 0);
      i++;
      if (i === 10) {
        clearInterval(interval);
        t.end();
      }
    }, 100);
  });

  t.test('it should respond mousemove step', { timeout: 0 }, t => {
    el.focus();

    // reset the mouse to 0,0
    helper.mousemove(el, 'left', 100, `M0,0, 0,0`, () => {
      let results = [
        { x: 0, y: 0 },
        { x: 20, y: 20 },
        { x: 40, y: 40 },
        { x: 60, y: 60 },
        { x: 80, y: 80 },
        { x: 100, y: 100 },
      ];
      let idx = 0;

      helper.mousemoveStep(el, 'left', 5, `M0,0, L100,100`);

      setInterval(() => {
        t.equal(input.mouseX + 8, results[idx].x);
        t.equal(input.mouseY + 8, results[idx].y);
        idx += 1;

        if (idx === results.length) {

          t.end();
          return;
        }
      }, 100);
    });
  });
});
