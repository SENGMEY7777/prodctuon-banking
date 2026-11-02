const app = require('../app');
app.get('/', (req, res) => res.json({ success: true, message: "Core Banking API is live and running" }));
module.exports = app;