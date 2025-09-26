import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 7002;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React router - send all non-static requests to index.html
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production frontend server running on port ${port}`);
});