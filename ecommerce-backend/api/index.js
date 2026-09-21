require('dotenv').config();

// Vercel Node.js runtime accepts an Express app directly as the
// serverless function handler (it matches the (req, res) signature).
const app = require('../src/app');

module.exports = app;
