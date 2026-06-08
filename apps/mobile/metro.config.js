const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(path.resolve(__dirname));

config.watchFolders = [path.resolve(__dirname, '..', '..')];

config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '..', '..', 'node_modules'),
];

// Fix non-ASCII characters in project root path causing HTTP header issues
const originalEnhanceMiddleware = config.server && config.server.enhanceMiddleware;
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware, server) => {
  const enhancedMiddleware = (req, res, next) => {
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, value) {
      if (typeof value === 'string' && /[^\x00-\x7F]/.test(value)) {
        try {
          value = encodeURI(value);
        } catch (e) {
          value = value.replace(/[^\x00-\x7F]/g, '');
        }
      }
      return originalSetHeader(name, value);
    };
    return middleware(req, res, next);
  };
  if (originalEnhanceMiddleware) {
    return originalEnhanceMiddleware(enhancedMiddleware, server);
  }
  return enhancedMiddleware;
};

module.exports = config;