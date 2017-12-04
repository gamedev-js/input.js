'use strict';

const Input = require('../dist/input.js')

let el = document.createElement('div');
el.id = 'keyboard';
el.style.width = '0px';
el.style.height = '0px';
el.tabIndex = -1;
document.body.appendChild(el);
let input = new Input(document.getElementById('keyboard'));

suite(tap, 'input', t => {

  t.test('it should respond keydown "a"', t => {
    el.focus();

    helper.keydown('a');

    setTimeout(() => {
      t.equal(input.keydown('a'), true);
      input.reset();
      t.equal(input.keydown('a'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond keydown "command + t"', t => {
    el.focus();

    helper.keydown('t', ['command']);

    setTimeout(() => {
      t.equal(input.keydown('t'), true);
      input.reset();
      t.equal(input.keydown('t'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond keyup "b"', t => {
    el.focus();

    helper.keyup('b');

    setTimeout(() => {
      t.equal(input.keyup('b'), true);
      input.reset();
      t.equal(input.keyup('b'), false);

      t.end();
    }, 100);
  });

  t.test('it should respond keypress "b"', t => {
    el.focus();

    helper.keydown('b');

    setTimeout(() => {
      t.equal(input.keydown('b'), true);
      input.reset();
      t.equal(input.keypress('b'), true);
      
      t.end();
    }, 100);
  });
});
