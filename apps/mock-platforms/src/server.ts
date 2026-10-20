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
});
