<<<<<<< HEAD
import 'dotenv/config';
import express from 'express';
import { createMockMapsAApp } from './platforms/mockMapsA/index';
import { createMockMapsBApp } from './platforms/mockMapsB/index';
import { createMockDirectoryCApp } from './platforms/mockDirectoryC/index';

const PORT = Number(process.env.PORT) || 4100;

const app = express();
=======
import express from 'express';
import cors from 'cors';
import { mockMapsARouter } from './platforms/mockMapsA/index.js';
import { mockMapsBRouter } from './platforms/mockMapsB/index.js';
import { mockDirectoryCRouter } from './platforms/mockDirectoryC/index.js';

const app = express();
app.use(cors());
app.use(express.json());
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74

const mapsA = createMockMapsAApp();
const mapsB = createMockMapsBApp();
const directoryC = createMockDirectoryCApp();

// Mount under both standard prefixes so any caller configuration succeeds
app.use('/mock-maps-a', mapsA);
app.use('/maps-a', mapsA);

app.use('/mock-maps-b', mapsB);
app.use('/maps-b', mapsB);

app.use('/mock-directory-c', directoryC);
app.use('/directory-c', directoryC);

// Health check for Render
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-platforms' });
});

app.listen(PORT, () => {
<<<<<<< HEAD
  console.info(`[mock-platforms] Listening on http://localhost:${PORT}`);
  console.info(`  /mock-maps-a & /maps-a         → mockMapsA  (read-write)`);
  console.info(`  /mock-maps-b & /maps-b         → mockMapsB  (read-only)`);
  console.info(`  /mock-directory-c & /directory-c → mockDirectoryC (holiday-block)`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[mock-platforms] Unhandled rejection:', reason);
  process.exit(1);
=======
  console.log(`Mock platforms running on http://localhost:${PORT}`);
  console.log('  mock-maps-a      (read-write)');
  console.log('  mock-maps-b      (read-only)');
  console.log('  mock-directory-c (holiday-blocked)');
>>>>>>> d180802c4c2ddc23ddf2f8123f75e6f21fc6ee74
});
