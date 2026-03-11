const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
});

const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

