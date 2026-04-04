import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { FraftClient } from '@go-denki/fraft';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'https://fraft.playground.godenki.com',
];

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, same-origin) only in development
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

// Limit individual request body size to 64 KB to prevent payload flooding
app.use(express.json({ limit: '64kb' }));

// Allow at most 30 requests per minute per IP across all /api routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Tighter limit for /api/run since each call triggers an outbound HTTP request
const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many run requests, please slow down.' },
});

app.use('/api', apiLimiter);

const RUN_TIMEOUT_MS = 10_000;

app.post('/api/run', runLimiter, async (req, res) => {
  const { config, requestName } = req.body as {
    config: Record<string, unknown>;
    requestName: string;
  };

  if (!config || typeof config !== 'object') {
    res.status(400).json({ error: 'Invalid config: must be an object.' });
    return;
  }
  if (!requestName || typeof requestName !== 'string') {
    res.status(400).json({ error: 'requestName is required.' });
    return;
  }

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out.' });
    }
  }, RUN_TIMEOUT_MS);

  try {
    const client = new FraftClient({ config });
    const result = await client.run(requestName);
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({ result });
    }
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

app.get('/api/requests', (req, res) => {
  const { config } = req.query as { config?: string };
  if (!config) {
    res.status(400).json({ error: 'config query param required' });
    return;
  }
  try {
    const parsed = JSON.parse(config) as Record<string, unknown>;
    const client = new FraftClient({ config: parsed });
    const resolved = client.getConfig();
    res.json({ requests: Object.keys(resolved.requests) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`fraft playground server running on http://localhost:${PORT}`);
});
