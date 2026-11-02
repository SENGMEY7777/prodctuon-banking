process.env.VERCEL = "1";
let app;
const candidates = ["../app", "../server", "../index", "../src/app"];
for (const cand of candidates) {
    try {
        app = require(cand);
        if (app) break;
    } catch (_) {}
}
if (app && typeof app.get === 'function') {
    const handleRoot = (req, res) => {
        res.status(200).json({
            success: true,
            status: "online",
            message: "API server is live and running",
            timestamp: new Date().toISOString()
        });
    };
    app.get('/', handleRoot);
    app.get('/health', handleRoot);
    app.get('/api/health', handleRoot);
}
module.exports = app;
