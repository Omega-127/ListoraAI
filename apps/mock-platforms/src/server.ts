import express from 'express';
import { mockMapsARouter } from './platforms/mockMapsA/index';
import { mockMapsBRouter } from './platforms/mockMapsB/index';
import { mockDirectoryCRouter } from './platforms/mockDirectoryC/index';

const app = express();
app.use(express.json());

// Each platform is mounted under its own path prefix
app.use('/mock-maps-a', mockMapsARouter);
app.use('/mock-maps-b', mockMapsBRouter);
app.use('/mock-directory-c', mockDirectoryCRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-platforms' });
});

const PORT = Number(process.env.PORT) || 4100;
app.listen(PORT, () => {
  console.log(`Mock platforms running on http://localhost:${PORT}`);
  console.log('  mock-maps-a      (read-write)');
  console.log('  mock-maps-b      (read-only)');
  console.log('  mock-directory-c (holiday-blocked)');
});
