import { describe, it, expect } from 'vitest';
import { applyPick } from '../../src/transforms/pick.js';
import { applyRename } from '../../src/transforms/rename.js';
import { applyCoerce } from '../../src/transforms/coerce.js';
import { applyFilter } from '../../src/transforms/filter.js';

// ---------------------------------------------------------------------------
// pick
// ---------------------------------------------------------------------------

describe('applyPick', () => {
  it('picks keys from an object', () => {
    const result = applyPick({ id: 1, name: 'Alice', secret: 'x' }, { pick: ['id', 'name'] });
    expect(result).toEqual({ id: 1, name: 'Alice' });
  });

  it('picks keys from each item in an array', () => {
    const result = applyPick(
      [{ id: 1, name: 'Alice', x: 1 }, { id: 2, name: 'Bob', x: 2 }],
      { pick: ['id', 'name'] },
    );
    expect(result).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  });

  it('passes through non-object values unchanged', () => {
    expect(applyPick('hello', { pick: ['a'] })).toBe('hello');
    expect(applyPick(42, { pick: ['a'] })).toBe(42);
  });

  it('ignores missing keys without error', () => {
    const result = applyPick({ id: 1 }, { pick: ['id', 'missing'] });
    expect(result).toEqual({ id: 1 });
  });
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

describe('applyRename', () => {
  it('renames keys in an object', () => {
    const result = applyRename({ user_id: 1, full_name: 'Alice' }, { rename: { user_id: 'userId', full_name: 'fullName' } });
    expect(result).toEqual({ userId: 1, fullName: 'Alice' });
  });

  it('renames keys in each array item', () => {
    const result = applyRename(
      [{ user_id: 1 }, { user_id: 2 }],
      { rename: { user_id: 'userId' } },
    );
    expect(result).toEqual([{ userId: 1 }, { userId: 2 }]);
  });

  it('leaves unmapped keys unchanged', () => {
    const result = applyRename({ a: 1, b: 2 }, { rename: { a: 'alpha' } });
    expect(result).toEqual({ alpha: 1, b: 2 });
  });
});

// ---------------------------------------------------------------------------
// coerce
// ---------------------------------------------------------------------------

describe('applyCoerce', () => {
  it('coerces a string shorthand to a number', () => {
    const result = applyCoerce({ id: '42' }, { coerce: { id: 'number' } });
    expect(result).toEqual({ id: 42 });
  });

  it('coerces to boolean', () => {
    const result = applyCoerce({ active: 'true' }, { coerce: { active: 'boolean' } });
    expect(result).toEqual({ active: true });
  });

  it('coerces false-y strings to false', () => {
    const result = applyCoerce({ active: 'false' }, { coerce: { active: 'boolean' } });
    expect(result).toEqual({ active: false });
  });

  it('applies arithmetic expr', () => {
    const result = applyCoerce({ price: 1000 }, { coerce: { price: { expr: '/100' } } });
    expect(result).toEqual({ price: 10 });
  });

  it('applies format', () => {
    const result = applyCoerce({ score: 1.23456 }, { coerce: { score: { format: '%.2f' } } });
    expect(result).toEqual({ score: '1.23' });
  });

  it('works on arrays', () => {
    const result = applyCoerce(
      [{ count: '5' }, { count: '10' }],
      { coerce: { count: 'number' } },
    );
    expect(result).toEqual([{ count: 5 }, { count: 10 }]);
  });

  it('throws on invalid expr', () => {
    expect(() => applyCoerce({ x: 1 }, { coerce: { x: { expr: 'bad' } } })).toThrow('invalid coerce expr');
  });

  it('throws on division by zero', () => {
    expect(() => applyCoerce({ x: 1 }, { coerce: { x: { expr: '/0' } } })).toThrow('division by zero');
  });
});

// ---------------------------------------------------------------------------
// filter
// ---------------------------------------------------------------------------

describe('applyFilter', () => {
  const items = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 30 },
  ];

  it('filters by eq', () => {
    const result = applyFilter(items, { filter: { field: 'age', op: 'eq', value: 30 } });
    expect(result).toEqual([items[0], items[2]]);
  });

  it('filters by neq', () => {
    const result = applyFilter(items, { filter: { field: 'age', op: 'neq', value: 30 } });
    expect(result).toEqual([items[1]]);
  });

  it('filters by gt', () => {
    const result = applyFilter(items, { filter: { field: 'age', op: 'gt', value: 25 } });
    expect(result).toEqual([items[0], items[2]]);
  });

  it('filters by contains', () => {
    const result = applyFilter(items, { filter: { field: 'name', op: 'contains', value: 'li' } });
    expect(result).toEqual([items[0], items[2]]);
  });

  it('filters by startsWith', () => {
    const result = applyFilter(items, { filter: { field: 'name', op: 'startsWith', value: 'B' } });
    expect(result).toEqual([items[1]]);
  });

  it('filters by endsWith', () => {
    const result = applyFilter(items, { filter: { field: 'name', op: 'endsWith', value: 'e' } });
    expect(result).toEqual([items[0], items[2]]);
  });

  it('throws when data is not an array', () => {
    expect(() => applyFilter({ id: 1 }, { filter: { field: 'id', op: 'eq', value: 1 } })).toThrow('array');
  });
});
