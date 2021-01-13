// vue.config.js
module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/moctree/'
    : '/',
  runtimeCompiler: true,
}

