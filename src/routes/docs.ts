import { Router, type Request, type Response } from 'express';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const router = Router();

/**
 * GET /api/docs
 * Serves the OpenAPI specification for the authentication API.
 * Returns YAML content for tooling integration.
 */
router.get('/', (_req: Request, res: Response): void => {
  const specPath = resolve(
    process.cwd(),
    'specs',
    '001-user-auth',
    'contracts',
    'api.openapi.yaml',
  );

  readFile(specPath, 'utf-8')
    .then((content) => {
      res.setHeader('Content-Type', 'application/yaml');
      res.send(content);
    })
    .catch(() => {
      res.status(404).json({ error: 'API specification not found' });
    });
});

export default router;
