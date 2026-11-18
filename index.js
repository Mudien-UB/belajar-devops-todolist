import express from 'express';
import todoRouter from './routes/todoRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/dist', express.static('dist'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/todos', todoRouter);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
