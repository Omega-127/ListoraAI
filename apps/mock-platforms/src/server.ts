<<<<<<< HEAD
import 'dotenv/config';
import { createMockMapsAApp } from './platforms/mockMapsA/index.js';
import { createMockMapsBApp } from './platforms/mockMapsB/index.js';
import { createMockDirectoryCApp } from './platforms/mockDirectoryC/index.js';

const MAPS_A_PORT = Number(process.env.MOCK_MAPS_A_PORT) || 4101;
const MAPS_B_PORT = Number(process.env.MOCK_MAPS_B_PORT) || 4102;
const DIRECTORY_C_PORT = Number(process.env.MOCK_DIRECTORY_C_PORT) || 4103;

function startServer(
  app: ReturnType<typeof createMockMapsAApp>,
  port: number,
  name: string,
): void {
  app.listen(port, () => {
    console.info(`[mock-platforms] ${name} listening on http://localhost:${port}`);
  });
}

startServer(createMockMapsAApp(), MAPS_A_PORT, 'mockMapsA (read-write)');
startServer(createMockMapsBApp(), MAPS_B_PORT, 'mockMapsB (read-only)');
startServer(createMockDirectoryCApp(), DIRECTORY_C_PORT, 'mockDirectoryC (holiday-block)');

process.on('unhandledRejection', (reason) => {
  console.error('[mock-platforms] Unhandled rejection:', reason);
  process.exit(1);
=======
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
>>>>>>> 6d768f43304f1e607cd016ddcba2b8a70ef97568
});
