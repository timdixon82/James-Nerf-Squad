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

  // Some scripts (js/input.js) register window/document listeners at
  // top-level script scope (focus-loss handling). Provide minimal stubs
  // that record listeners so a test can trigger them directly, without
  // pulling in a full DOM implementation.
  const listeners = { window: {}, document: {} };
  function makeTarget(name) {
    return {
      addEventListener(type, fn) {
        (listeners[name][type] = listeners[name][type] || []).push(fn);
      },
      visibilityState: 'visible',
    };
  }

  const sandbox = { window: makeTarget('window'), document: makeTarget('document'), Math };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: fullPath });
  sandbox.__listeners = listeners;
  sandbox.__fireListeners = function (target, type) {
    (listeners[target][type] || []).forEach((fn) => fn());
  };
  return sandbox;
}
