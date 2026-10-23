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

// Mount Indian Platforms
app.use('/google-maps-india', mapsA);
app.use('/google-maps', mapsA);
app.use('/googleMaps', mapsA);

app.use('/mappls-india', mapsB);
app.use('/mappls', mapsB);
app.use('/mapmyindia', mapsB);

app.use('/justdial-india', directoryC);
app.use('/justdial', directoryC);

// Mount under standard legacy prefixes so any caller configuration succeeds
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
  res.json({ status: 'ok', service: 'mock-platforms', region: 'IN' });
});

app.listen(PORT, () => {
  console.info(`[platforms-india] Listening on http://localhost:${PORT}`);
  console.info(`  /google-maps-india  → Google Maps (India) (read-write)`);
  console.info(`  /mappls-india       → Mappls / MapmyIndia  (read-only)`);
  console.info(`  /justdial-india     → Justdial (India)     (holiday-sync)`);

  if (process.env.NODE_ENV === 'production') {
    const externalUrl = process.env.RENDER_EXTERNAL_URL;
    if (externalUrl) {
      setInterval(async () => {
        try {
          await fetch(`${externalUrl}/health`);
        } catch {
          // ignore
        }
      }, 13 * 60 * 1000);
    }
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[mock-platforms] Unhandled rejection:', reason);
  process.exit(1);
});
