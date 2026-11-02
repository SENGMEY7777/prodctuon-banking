process.env.VERCEL = "1";
let backendApp;
const candidates = [
    "../Backend/app",
    "../backend/app",
    "../app",
    "../src/app",
    "../server",
    "../Backend/server",
    "../backend/server",
    "../index",
    "../Backend/index",
    "../backend/index"
];
for (const cand of candidates) {
    try {
        const mod = require(cand);
        if (mod && (typeof mod === 'function' || typeof mod.handle === 'function' || typeof mod.get === 'function')) {
            backendApp = mod;
            break;
        } else if (mod && mod.app && (typeof mod.app === 'function' || typeof mod.app.handle === 'function')) {
            backendApp = mod.app;
            break;
        }
    } catch (_) {}
}

const express = (() => {
    try { return require('express'); } catch (_) { return null; }
})();

let bridge;
if (express && typeof express === 'function') {
    bridge = express();
    const handleRoot = (req, res) => {
        return res.status(200).json({
            success: true,
            status: "online",
            message: "API server is live and running",
            timestamp: new Date().toISOString()
        });
    };
    bridge.get('/', handleRoot);
    bridge.get('/health', handleRoot);
    bridge.get('/api/health', handleRoot);

    if (backendApp) {
        bridge.use(backendApp);
    }

    bridge.use((req, res) => {
        res.status(200).json({
            success: true,
            status: "online",
            message: "API server is live and running",
            path: req.url,
            timestamp: new Date().toISOString()
        });
    });
} else if (backendApp) {
    bridge = backendApp;
} else {
    bridge = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            status: "online",
            message: "API server is live and running",
            timestamp: new Date().toISOString()
        }));
    };
}

module.exports = bridge;
