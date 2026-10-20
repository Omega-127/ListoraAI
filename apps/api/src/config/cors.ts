/**
 * CORS configuration.
 * Reads allowed origins from the validated env.
 * Cross-domain cookies require credentials:true and an explicit (non-wildcard) origin list.
 */
import cors from 'cors';
import { corsOrigins } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin requests (origin is undefined) and listed origins
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
