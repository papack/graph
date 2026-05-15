type Path = Array<string | number>;
type AnyObject = Record<string, any>;
type EntityKey = string;
type Updater<T> = (value: T) => T;
type GetResult<T, K extends keyof T> = Cursor<T[K]>;
type IndexMap = Map<string, Path>;

const DEFAULT_KEYS = ["id", "uuid"];

function isObject(value: unknown): value is AnyObject {
  return typeof value === "object" && value !== null;
}

function isEntity(value: unknown, keys: readonly string[]): value is AnyObject {
  if (!isObject(value)) return false;

  return keys.some((key) => typeof value[key] === "string");
}

function getEntityId(
  value: AnyObject,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const id = value[key];

    if (typeof id === "string") {
      return id;
    }
  }

  return undefined;
}

function getAtPath(root: any, path: Path): any {
  let current = root;

  for (const segment of path) {
    current = current[segment];
  }

  return current;
}

function setAtPath(root: any, path: Path, value: any): void {
  if (path.length === 0) {
    throw new Error("Cannot replace root");
  }

  const parent = getAtPath(root, path.slice(0, -1));
  const key = path[path.length - 1]!;

  parent[key] = value;
}

function buildIndex(root: any, entityKeys: readonly string[]): IndexMap {
  const index = new Map<string, Path>();
  const visited = new WeakSet<object>();

  function walk(value: any, path: Path): void {
    if (!isObject(value)) return;

    if (visited.has(value)) return;
    visited.add(value);

    if (isEntity(value, entityKeys)) {
      const id = getEntityId(value, entityKeys);

      if (id) {
        index.set(id, [...path]);
      }
    }

    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        walk(item, [...path, i]);
      });

      return;
    }

    for (const key of Object.keys(value)) {
      walk(value[key], [...path, key]);
    }
  }

  walk(root, []);

  return index;
}

class Cursor<T> {
  constructor(
    private readonly rootRef: { current: any },
    private readonly path: Path,
    private readonly entityKeys: readonly string[],
  ) {}

  private reindex(): IndexMap {
    return buildIndex(this.rootRef.current, this.entityKeys);
  }

  value(): T {
    return getAtPath(this.rootRef.current, this.path);
  }

  get<K extends keyof T>(key: K): GetResult<T, K>;

  get(id: string): Cursor<any>;

  get(key: any): Cursor<any> {
    const current = this.value();

    // direct property access
    if (
      isObject(current) &&
      (typeof key === "string" || typeof key === "number") &&
      key in current
    ) {
      return new Cursor(this.rootRef, [...this.path, key], this.entityKeys);
    }

    // indexed entity lookup
    if (typeof key === "string") {
      const index = this.reindex();
      const path = index.get(key);

      if (!path) {
        throw new Error(`Missing entity: ${key}`);
      }

      return new Cursor(this.rootRef, path, this.entityKeys);
    }

    throw new Error(`Invalid key: ${String(key)}`);
  }

  set(updater: Updater<T>): this {
    const current = this.value();
    const next = updater(current);

    if (this.path.length === 0) {
      this.rootRef.current = next;
      return this;
    }

    if (next !== current) {
      setAtPath(this.rootRef.current, this.path, next);
    }

    return this;
  }
}

export function idx<T>(value: T, key?: EntityKey | EntityKey[]): Cursor<T> {
  const entityKeys = Array.isArray(key) ? key : key ? [key] : DEFAULT_KEYS;

  return new Cursor({ current: value }, [], entityKeys);
}
