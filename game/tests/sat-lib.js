// Loads src/sat/globe-logic.js in node (bundled on the fly with esbuild), for the satellite tools.
const esbuild = require('esbuild');
const path = require('path');
module.exports = () => {
  const r = esbuild.buildSync({ entryPoints: [path.join(__dirname, '../src/sat/globe-logic.js')], bundle: true, format: 'cjs', platform: 'node', write: false });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
};
