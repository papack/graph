# @papack/idx

Typed traversal and UUID lookup for deeply nested objects and arrays.

Every object containing a `uuid` field becomes recursively searchable.

## Installation

```bash
npm install @papack/idx
```

## Example

```typescript
import { idx } from "@papack/idx";

const document = {
  uuid: "root",

  sections: [
    {
      uuid: "hero-1",

      content: {
        title: {
          uuid: "title-1",
          value: "Hello",
        },
      },
    },
  ],
};

idx(document)
  .get("sections")
  .find("hero-1")
  .get("content")
  .get("title")
  .set((title) => {
    title.value += " World";

    return title;
  });

console.log(document.sections[0].content.title.value);

// Hello World
```

## Access

### Typed property traversal

`.get()` preserves autocomplete and type inference.

```typescript
idx(document).get("sections").get(0).get("content").get("title");
```

### Recursive UUID lookup

`.find()` searches recursively from the current cursor.

```typescript
idx(document).get("sections").find("hero-1");
```

```typescript
idx(document).get("sections").find("hero-1").get("content").get("title");
```

## Reading values

```typescript
const title = idx(document).get("sections").find("title-1").value();

title.value;
```

`.value()` returns the original reference.

## Updating values

### Mutate values

```typescript
idx(document)
  .get("sections")
  .find("title-1")
  .set((title) => {
    title.value = "Updated";

    return title;
  });
```

### Replace values

```typescript
idx(document)
  .get("sections")
  .find("title-1")
  .set((title) => ({
    ...title,
    value: "Replaced",
  }));
```

### Replace arrays

```typescript
idx(document)
  .get("sections")
  .set(() => []);
```

### Filter arrays

```typescript
idx(document)
  .get("sections")
  .set((sections) => sections.filter((section) => section.uuid !== "hero-1"));
```

## TypeScript

### Automatic typing

`.get()` is automatically typed from the current cursor.

```typescript
idx(document)
  .get("sections")
  .get(0)
  .get("content")
  .get("title")
  .set((title) => {
    title.value;
    // string

    return title;
  });
```

### Manual typing for `.find()`

UUID lookup cannot be typed automatically because TypeScript cannot infer runtime UUID values.

You can provide the expected type manually:

```typescript
interface Section {
  uuid: string;

  content: {
    title: {
      uuid: string;
      value: string;
    };
  };
}

idx(document).find<Section>("hero-1").get("content").get("title");
```

Invalid keys then produce TypeScript errors:

```typescript
idx(document).find<Section>("hero-1").get("invalid");
// TypeScript error
```

## API

```typescript
idx(value).get(key).find(uuid).value().set(updater);
```

## Behavior

- Objects are never cloned automatically
- References are preserved unless replaced
- Arrays remain arrays
- UUIDs are searched recursively
- Cycles are supported
- `.get()` is typed local traversal
- `.find()` performs recursive UUID lookup
- `.value()` returns the raw value
- Missing UUIDs throw runtime errors
