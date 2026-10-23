import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createMockMapsAApp } from './platforms/mockMapsA/index';
import { createMockMapsBApp } from './platforms/mockMapsB/index';
import { createMockDirectoryCApp } from './platforms/mockDirectoryC/index';

const PORT = Number(process.env.PORT) || 4100;

const app = express();
app.use(cors());
app.use(express.json());

const mapsA = createMockMapsAApp();
const mapsB = createMockMapsBApp();
const directoryC = createMockDirectoryCApp();

// Mount under standard prefixes so any caller configuration succeeds
app.use('/mock-maps-a', mapsA);
app.use('/maps-a', mapsA);
app.use('/mockMapsA', mapsA);

app.use('/mock-maps-b', mapsB);
app.use('/maps-b', mapsB);
app.use('/mockMapsB', mapsB);

app.use('/mock-directory-c', directoryC);
app.use('/directory-c', directoryC);
app.use('/mockDirectoryC', directoryC);

// Health check for Render
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-platforms' });
});

app.listen(PORT, () => {
  console.info(`[mock-platforms] Listening on http://localhost:${PORT}`);
  console.info(`  /mock-maps-a & /maps-a         → mockMapsA  (read-write)`);
  console.info(`  /mock-maps-b & /maps-b         → mockMapsB  (read-only)`);
  console.info(`  /mock-directory-c & /directory-c → mockDirectoryC (holiday-block)`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[mock-platforms] Unhandled rejection:', reason);
  process.exit(1);
});
