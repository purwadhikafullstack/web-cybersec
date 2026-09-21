const express = require('express');
const cors = require('cors');

const routes = require('./routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ticketing-backend' });
});

app.use('/api', routes);

module.exports = app;
