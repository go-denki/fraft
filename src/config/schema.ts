import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const ApiKeyAuthSchema = z.object({
  type: z.literal('apiKey'),
  in: z.enum(['header', 'query']),
  name: z.string().min(1),
  value: z.string(),
});

const AuthConfigSchema = ApiKeyAuthSchema;

// ---------------------------------------------------------------------------
// Transform steps
// ---------------------------------------------------------------------------

const PickStepSchema = z.object({
  pick: z.array(z.string()).min(1),
});

const RenameStepSchema = z.object({
  rename: z.record(z.string()),
});

const CoerceRuleSchema = z.union([
  z.enum(['string', 'number', 'boolean']),
  z.object({
    type: z.enum(['string', 'number', 'boolean']).optional(),
    format: z.string().optional(),
    expr: z.string().optional(),
  }),
]);

const CoerceStepSchema = z.object({
  coerce: z.record(CoerceRuleSchema),
});

const FilterStepSchema = z.object({
  filter: z.object({
    field: z.string().min(1),
    op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']),
    value: z.unknown(),
  }),
});

const MiddlewareStepSchema = z.object({
  middleware: z.string().min(1),
});

const TransformStepSchema = z.union([
  PickStepSchema,
  RenameStepSchema,
  CoerceStepSchema,
  FilterStepSchema,
  MiddlewareStepSchema,
]);

// ---------------------------------------------------------------------------
// Request definition
// ---------------------------------------------------------------------------

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const RequestDefSchema = z.object({
  path: z.string().min(1),
  method: HttpMethodSchema.default('GET'),
  headers: z.record(z.string()).optional(),
  params: z.record(z.unknown()).optional(),
  body: z.unknown().optional(),
  transform: z.array(TransformStepSchema).optional(),
  axiosConfig: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Top-level config
// ---------------------------------------------------------------------------

export const FraftConfigSchema = z.object({
  version: z.number().int().positive().default(1),
  baseUrl: z.string().url(),
  headers: z.record(z.string()).optional(),
  auth: AuthConfigSchema.optional(),
  requests: z.record(RequestDefSchema).refine(
    (v) => Object.keys(v).length > 0,
    { message: 'requests must contain at least one entry' },
  ),
});

export type ValidatedFraftConfig = z.infer<typeof FraftConfigSchema>;
