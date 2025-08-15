module.exports = function override(config, env) {
  // Disable webpack dev server overlay for tests
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      client: {
        overlay: false
      }
    };
  }
  
  return config;
};