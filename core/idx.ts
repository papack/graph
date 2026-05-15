type Path = Array<string | number>;

type Updater<T> = (value: T) => T;

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function getAtPath(root: any, path: Path) {
  return path.reduce((current, key) => current[key], root);
}

function findPath(
  value: any,
  uuid: string,
  path: Path = [],
  visited = new WeakSet<object>(),
): Path | undefined {
  if (!isObject(value)) return;

  if (visited.has(value)) return;
  visited.add(value);

  if (value.uuid === uuid) {
    return path;
  }

  if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) {
      const result = findPath(item, uuid, [...path, i], visited);

      if (result) return result;
    }

    return;
  }

  for (const key in value) {
    const result = findPath(value[key], uuid, [...path, key], visited);

    if (result) return result;
  }
}

class Cursor<T> {
  constructor(
    private root: { current: any },
    private path: Path,
  ) {}

  value(): T {
    return getAtPath(this.root.current, this.path);
  }

  get<TKey extends keyof T>(key: TKey): Cursor<T[TKey]> {
    return new Cursor(this.root, [...this.path, key as string]);
  }

  find<TFound = any>(uuid: string): Cursor<TFound> {
    const path = findPath(this.value(), uuid);

    if (!path) {
      throw new Error(`Missing entity: ${uuid}`);
    }

    return new Cursor<TFound>(this.root, [...this.path, ...path]);
  }

  set(updater: Updater<T>): this {
    const current = this.value();
    const next = updater(current);

    if (this.path.length === 0) {
      this.root.current = next;
      return this;
    }

    const parent = getAtPath(this.root.current, this.path.slice(0, -1));

    parent[this.path[this.path.length - 1]!] = next;

    return this;
  }
}

export function idx<T>(value: T) {
  return new Cursor<T>({ current: value }, []);
}
