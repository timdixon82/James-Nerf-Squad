/**
 * load-script.js
 *
 * James Nerf Squad ships its JavaScript as plain var-scoped ES5-style
 * script files loaded via <script src> tags (see docs/decisions/002-module-load-order.md).
 * There is no bundler and no ES module export. To unit test the pure
 * helper functions in js/utils.js without changing that architecture, this
 * helper reads a script file's source and runs it in a fresh Node vm
 * context, then returns the context so a test can read the top-level
 * `var` declarations off it (var at script scope becomes a context
 * property, the same way it becomes a `window` property in the browser).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadScript(relativePath) {
  const fullPath = path.join(__dirname, '..', '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const sandbox = { window: {}, Math };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: fullPath });
  return sandbox;
}
