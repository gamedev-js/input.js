'ues strict';

const ip = require('ip');
const qrcode = require('qrcode-terminal');
const {spawn} = require('child_process');

const argv = process.argv.slice(1);
const option = { port: 8001 };

for (let i = 0; i < argv.length; ++i) {
  if (argv[i] === '--port' || argv[i] === '-p') {
    option.port = argv[++i];
    break;
  }
}

function blue(str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m';
}

let addr = ip.address();
let url = `http://${addr}:${option.port}`;

console.log(`IP: ${blue(addr)}`);
qrcode.generate(url, code => {
  console.log(code);

  spawn('http-server', [
    './', '-a', 'localhost', '-p', option.port, '-c-1'
  ], {
    stdio: 'inherit'
  });
});