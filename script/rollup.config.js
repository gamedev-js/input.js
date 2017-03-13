'use strict';

const version = require('../package.json').version;

let banner = `
/*
 * gamedev-js/input v${version}
 * (c) ${new Date().getFullYear()} @Johnny Wu
 * Released under the MIT License.
 */
`;

module.exports = {
  entry: './index.js',
  targets: [
    { dest: 'dist/input.dev.js', format: 'iife' },
    { dest: 'dist/input.js', format: 'cjs' },
  ],
  moduleName: 'Input',
  banner: banner,
  external: [],
  globals: {},
  sourceMap: true,
};