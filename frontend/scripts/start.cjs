const { spawn } = require('child_process');
const path = require('path');

const port = String(process.env.PORT || 4173);
// Run the JS entrypoint directly instead of spawning the platform-specific
// wrapper in node_modules/.bin (which can be flaky on Windows environments).
const serveEntrypoint = path.join(__dirname, '..', 'node_modules', 'serve', 'build', 'main.js');

const child = spawn(process.execPath, [serveEntrypoint, '-s', 'dist', '-l', port], {
  stdio: 'inherit',
  windowsHide: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
