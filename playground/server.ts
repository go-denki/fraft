import express from 'express';
import cors from 'cors';
import { FraftClient } from '@go-denki/fraft';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/run', async (req, res) => {
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

  try {
    const client = new FraftClient({ config });
    const result = await client.run(requestName);
    res.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
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
