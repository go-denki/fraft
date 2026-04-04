export function readFileSync(): never {
  throw new Error(
    'File system access is not available in the browser. Pass a config object instead of a file path.',
  );
}
