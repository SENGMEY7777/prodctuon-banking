require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoute = require('./routes/users/authRoute');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoute);
// Backwards-compatible path used by the current API client collection.
app.use('/api/user/auth', authRoute);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
    ...(err.errors ? { errors: err.errors } : {})
  });
});

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

module.exports = app;
