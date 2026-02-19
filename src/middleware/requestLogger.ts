import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

/**
 * HTTP request logging middleware using pino-http.
 * Logs method, URL, status code, and response time for each request.
 * Automatically redacts sensitive fields.
 */
export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if ((err !== null && err !== undefined) || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return `${((req as any).method as string) ?? 'UNKNOWN'} ${((req as any).url as string) ?? '/'}`;
  },
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
    censor: '[REDACTED]',
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  serializers: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    req: (req: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      method: req.method,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      url: req.url,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      remoteAddress: req.remoteAddress,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: (res: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      statusCode: res.statusCode,
    }),
  },
});
