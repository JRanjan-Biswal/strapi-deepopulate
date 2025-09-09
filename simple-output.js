const bigText = `
  ___    _____    _____    _
 / __\\  /  _  \\  /  _  \\  | |
| |     | | | |  | | | |  | |
| |___  | |_| |  | |_| |  | |___
 \\___/  \\_____/  \\_____/  |_____|
`;

(async function () {
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', bigText);
    console.log('\n');
    console.log('\x1b[32m1. add\x1b[0m \x1b[33m{"deepopulate": "strapi-deepopulate"}\x1b[0m \x1b[32mto scripts in package.json\x1b[0m');
    console.log('\x1b[32m2. run\x1b[0m \x1b[33mnpm run deepopulate\x1b[0m \x1b[32mto install the middleware\x1b[0m');
    console.log('\x1b[32m2. Note:\x1b[0m \x1b[31mThis command replaces api, component folder and middleware file with new one.\x1b[0m ');
})()