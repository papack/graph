type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type AnyObj = Record<PropertyKey, any>;
type AnyFn = (...args: any[]) => any;

type GraphArray<U, Key extends string> = Omit<U[], keyof any[]> & {
  [id: string]: GraphObject<U, Key>;
} & Array<GraphObject<U, Key>>;

type GraphObject<T, Key extends string> = {
  [P in keyof T]: Graphify<T[P], Key>;
};

type IsNever<T> = [T] extends [never] ? true : false;

export type Graphify<T, Key extends string> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? IsNever<U> extends true
      ? GraphArray<any, Key>
      : GraphArray<U, Key>
    : T extends object
      ? GraphObject<T, Key>
      : T;

function isPlainObject(value: unknown): value is AnyObj {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
}

export function graph<T extends object[], Key extends string>(
  data: T,
  key: Key,
): Graphify<T, Key> {
  const cache = new WeakMap<object, any>();

  function isEntityArray(value: unknown): value is AnyObj[] {
    return (
      Array.isArray(value) &&
      value.every((item) => isPlainObject(item) && key in item)
    );
  }

  function wrap(value: any): any {
    if (!Array.isArray(value) && !isPlainObject(value)) {
      return value;
    }

    const cached = cache.get(value);

    if (cached) {
      return cached;
    }

    /**
     * ENTITY ARRAY
     */
    if (isEntityArray(value)) {
      const proxy = new Proxy(value, {
        get(arr, prop, receiver): any {
          /**
           * IMPORTANT:
           * Explicit `any` return type.
           *
           * This preserves deep dynamic access:
           *
           * g["u1"].posts["p1"].comments["c1"]
           *
           * without TypeScript collapsing
           * recursive array intersections.
           */

          // native array behavior
          if (
            typeof prop !== "string" ||
            prop in arr ||
            prop in Array.prototype ||
            prop in Object.prototype
          ) {
            const native = Reflect.get(arr, prop, receiver);

            if (typeof native === "function") {
              return (native as AnyFn).bind(arr);
            }

            return wrap(native);
          }

          const found = arr.find((item) => String(item[key]) === prop);

          if (!found) {
            throw new Error(`Entity "${prop}" not found`);
          }

          return wrap(found);
        },

        set(arr, prop, value) {
          // native array index
          if (typeof prop !== "string" || /^\d+$/.test(prop)) {
            return Reflect.set(arr, prop, value);
          }

          const index = arr.findIndex((item) => String(item[key]) === prop);

          // replace existing
          if (index !== -1) {
            arr[index] = value;

            return true;
          }

          // add new
          if (isPlainObject(value) && String(value[key]) === prop) {
            arr.push(value);

            return true;
          }

          // ignore invalid writes
          return true;
        },

        deleteProperty(arr, prop) {
          if (typeof prop !== "string") {
            return false;
          }

          const index = arr.findIndex((item) => String(item[key]) === prop);

          if (index === -1) {
            return false;
          }

          arr.splice(index, 1);

          return true;
        },
      });

      cache.set(value, proxy);

      return proxy;
    }

    /**
     * NORMAL OBJECT
     */
    const proxy = new Proxy(value, {
      get(obj, prop, receiver) {
        return wrap(Reflect.get(obj, prop, receiver));
      },

      set(obj, prop, value, receiver) {
        return Reflect.set(obj, prop, value, receiver);
      },

      deleteProperty(obj, prop) {
        return Reflect.deleteProperty(obj, prop);
      },
    });

    cache.set(value, proxy);

    return proxy;
  }

  return wrap(data);
}
