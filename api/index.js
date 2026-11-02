let app;
const candidates = ["../app", "../Backend/app", "../backend/app", "../src/app", "../server", "../Backend/server", "../backend/server", "../index", "../Backend/index", "../backend/index"];
for (const cand of candidates) {
    try {
        app = require(cand);
        if (app) break;
    } catch (_) {}
}
module.exports = app;
