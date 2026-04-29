const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [projectRoot, monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// 워크스페이스 호환을 위해 server root를 monorepo root로 설정
// 이렇게 해야 manifest의 'apps/mobile/index.bundle' URL이 올바르게 해석됨
config.server = config.server || {};
config.server.unstable_serverRoot = monorepoRoot;

config.transformer = config.transformer || {};
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
