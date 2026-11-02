const app = require('../app') || require('../server') || require('../src/app');

module.exports = (req, res) => {
  return app(req, res);
};