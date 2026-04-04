import type { TransformStep, RequestContext } from '../types.js';
import type { MiddlewareRegistry } from '../middleware/registry.js';
import { applyPick } from './pick.js';
import { applyRename } from './rename.js';
import { applyCoerce } from './coerce.js';
import { applyFilter } from './filter.js';

export async function runPipeline(
  data: unknown,
  steps: TransformStep[],
  registry: MiddlewareRegistry,
  context: RequestContext,
): Promise<unknown> {
  let result = data;

  for (const step of steps) {
    if ('pick' in step) {
      result = applyPick(result, step);
    } else if ('rename' in step) {
      result = applyRename(result, step);
    } else if ('coerce' in step) {
      result = applyCoerce(result, step);
    } else if ('filter' in step) {
      result = applyFilter(result, step);
    } else if ('middleware' in step) {
      const fn = registry.get(step.middleware);
      result = await fn(result, context);
    } else {
      throw new Error(`fraft: unknown transform step: ${JSON.stringify(step)}`);
    }
  }

  return result;
}
