if (typeof global !== 'undefined' && !global.__fbBatchedBridgeConfig) {
  global.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
  };
}

// Patch UIManager for web — react-native-web does not include hasViewManagerConfig
const { UIManager } = require('react-native');
if (UIManager && typeof UIManager.hasViewManagerConfig !== 'function') {
  UIManager.hasViewManagerConfig = function() { return false; };
}

const { registerRootComponent } = require('expo');
const App = require('./App').default;

registerRootComponent(App);
