const fs = require('fs');
const path = require('path');

const CANDIDATE_SUFFIXES = [
  '.web.js',
  '.native.js',
  '.android.js',
  '.ios.js',
  '.flow.js',
];

const JS_SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);

const CUSTOM_SHIMS = {
  'Utilities/Platform.js': `'use strict';
module.exports = {
  OS: 'web',
  Version: '0',
  isTesting: false,
  isTV: false,
  constants: { reactNativeVersion: { major: 0, minor: 74, patch: 5, prerelease: null } },
  select: function(spec) {
    if ('web' in spec) return spec.web;
    if ('default' in spec) return spec.default;
    return undefined;
  },
};
`,
  'Utilities/BackHandler.js': `'use strict';\nmodule.exports = {\n  exitApp() {},\n  addEventListener() {\n    return { remove() {} };\n  },\n  removeEventListener() {},\n};\n`,
  'Components/AccessibilityInfo/legacySendAccessibilityEvent.js': `'use strict';\nmodule.exports = function legacySendAccessibilityEvent() {};\n`,
  'Alert/RCTAlertManager.js': `'use strict';\nmodule.exports = {\n  alertWithArgs() {},\n};\n`,
  'Network/RCTNetworking.js': `'use strict';\nmodule.exports = {\n  sendRequest() {},\n  abortRequest() {},\n  addListener() {},\n  removeListeners() {},\n  clearCookies(callback) {\n    if (typeof callback === 'function') callback(true);\n  },\n};\n`,
  'DevToolsSettings/DevToolsSettingsManager.js': `'use strict';\nmodule.exports = {\n  setGlobalHookSettings() {},\n};\n`,
  'NativeComponent/BaseViewConfig.js': `'use strict';\nmodule.exports = {};\n`,
  'StyleSheet/PlatformColorValueTypes.js': `'use strict';\nmodule.exports = {};\n`,
  'BatchedBridge/NativeModules.js': `'use strict';\nvar noop = function() {};\nmodule.exports = global.nativeModuleProxy || {\n  SourceCode: { scriptURL: '' },\n  LogBox: { install: noop, uninstall: noop },\n  UIManager: {\n    getConstants: function() { return { ViewManagerNames: [], customBubblingEventTypes: {}, customDirectEventTypes: {} }; },\n    createView: noop, updateView: noop, manageChildren: noop, setChildren: noop,\n    measure: noop, measureInWindow: noop, measureLayout: noop,\n    dispatchViewManagerCommand: noop, setJSResponder: noop, clearJSResponder: noop,\n    configureNextLayoutAnimation: noop, setLayoutAnimationEnabledExperimental: noop,\n    getConstantsForViewManager: function() { return {}; },\n    hasViewManagerConfig: function() { return false; },\n    getViewManagerConfig: function() { return {}; },\n  },\n  Timing: { createTimer: noop, deleteTimer: noop, setSendIdleEvents: noop },\n  PlatformConstants: { reactNativeVersion: { major: 0, minor: 74, patch: 5, prerelease: null }, isTesting: false, osVersion: 'web', systemName: 'web', forceTouchAvailable: false },\n};\n`,
  'TurboModule/TurboModuleRegistry.js': `'use strict';\nvar NativeModules = require('../BatchedBridge/NativeModules');\nfunction stub() { return new Proxy({}, { get: function() { return stub; } }); }\nfunction requireModule(name) {\n  if (global.__turboModuleProxy) {\n    var m = global.__turboModuleProxy(name);\n    if (m != null) return m;\n  }\n  if (NativeModules && NativeModules[name] != null) {\n    return NativeModules[name];\n  }\n  return null;\n}\nexports.get = function get(name) { return requireModule(name); };\nexports.getEnforcing = function getEnforcing(name) {\n  var m = requireModule(name);\n  if (m != null) return m;\n  return stub();\n};\n`,
};

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function writeShim(jsPath, targetBasePath, chosenSuffix) {
  const targetName = `./${path.basename(targetBasePath)}${chosenSuffix.replace(/\.js$/, '')}`;
  const content = `'use strict';\nmodule.exports = require('${targetName}');\n`;
  fs.writeFileSync(jsPath, content, 'utf8');
  return targetName;
}

function walkFiles(dirPath, collector) {
  if (!fileExists(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collector);
      continue;
    }

    if (JS_SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      collector.push(fullPath);
    }
  }
}

function extractRelativeTargets(source) {
  const targets = new Set();
  const regexes = [
    /require\(['"](\.[^'"]+)['"]\)/g,
    /from\s+['"](\.[^'"]+)['"]/g,
    /import\s+['"](\.[^'"]+)['"]/g,
  ];

  for (const regex of regexes) {
    for (const match of source.matchAll(regex)) {
      targets.add(match[1]);
    }
  }

  return [...targets];
}

function ensureResolvableModule(sourceFilePath, relativeTarget, root) {
  // Ignore imports that already specify an extension.
  if (path.extname(relativeTarget)) {
    return null;
  }

  const absoluteBase = path.resolve(path.dirname(sourceFilePath), relativeTarget);
  const directJs = `${absoluteBase}.js`;
  const directJson = `${absoluteBase}.json`;
  const indexJs = path.join(absoluteBase, 'index.js');

  if (fileExists(directJs) || fileExists(directJson) || fileExists(indexJs)) {
    return null;
  }

  const suffix = CANDIDATE_SUFFIXES.find((s) => fileExists(`${absoluteBase}${s}`));
  if (!suffix) {
    return null;
  }

  const targetName = writeShim(directJs, absoluteBase, suffix);
  return `${path.relative(root, directJs)} -> ${targetName}`;
}

function applyCustomShims(librariesRoot, root) {
  let created = 0;

  for (const [relativePath, content] of Object.entries(CUSTOM_SHIMS)) {
    const targetPath = path.join(librariesRoot, relativePath);
    fs.writeFileSync(targetPath, content, 'utf8');
    created += 1;
    console.log(`[fix:web-shims] Wrote ${path.relative(root, targetPath)}`);
  }

  return created;
}

function createMissingShims() {
  const root = process.cwd();
  const reactNativeRoot = path.join(root, 'node_modules', 'react-native');
  const librariesRoot = path.join(reactNativeRoot, 'Libraries');

  if (!fileExists(librariesRoot)) {
    console.log('[fix:web-shims] Skipping: react-native Libraries directory not found.');
    return;
  }

  const sourceFiles = [];
  walkFiles(librariesRoot, sourceFiles);

  let created = applyCustomShims(librariesRoot, root);
  for (const sourceFilePath of sourceFiles) {
    const source = fs.readFileSync(sourceFilePath, 'utf8');
    const relativeTargets = extractRelativeTargets(source);

    for (const relativeTarget of relativeTargets) {
      const createdEntry = ensureResolvableModule(sourceFilePath, relativeTarget, root);
      if (!createdEntry) {
        continue;
      }

      created += 1;
      console.log(`[fix:web-shims] Created ${createdEntry}`);
    }
  }

  if (created === 0) {
    console.log('[fix:web-shims] No shims needed.');
  } else {
    console.log(`[fix:web-shims] Created ${created} shim file(s).`);
  }
}

createMissingShims();
