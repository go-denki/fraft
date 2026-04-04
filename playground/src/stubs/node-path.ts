export function resolve(): never {
  throw new Error(
    'Path operations are not available in the browser. Pass a config object instead of a file path.',
  );
}

export function extname(): never {
  throw new Error(
    'Path operations are not available in the browser. Pass a config object instead of a file path.',
  );
}
