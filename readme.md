# @papack/idx

Typed index traversal for deeply nested objects and arrays.  
Objects containing an ID key (`"id"`, `"uuid"`, etc.) become globally addressable.

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

const doc = idx(document, "uuid");

doc
  .get("hero-1")
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

```typescript
doc.get("hero-1");

doc.get("hero-1").get("content").get("title");
```

### Reading values

```typescript
const title = doc.get("title-1").value();

title.value;
```

`.value()` returns the original reference.

## Updating values

### Update values

```typescript
doc.get("title-1").set((title) => {
  title.value = "Updated";

  return title;
});
```

### Replace values

```typescript
doc.get("title-1").set((title) => ({
  ...title,
  value: "Replaced",
}));
```

### Replace arrays

```typescript
doc
  .get("gallery-1")
  .get("images")
  .set(() => []);
```

### Filter arrays

```typescript
doc
  .get("sections")
  .set((sections) => sections.filter((section) => section.uuid !== "hero-1"));
```

## TypeScript

Traversal preserves autocomplete and type inference.

```typescript
doc
  .get("hero-1")
  .get("content")
  .get("title")
  .set((title) => {
    title.value;
    // string

    return title;
  });
```

## API

```typescript
idx(value, key?)

.get(key)
.value()
.set(updater)
```

## Behavior

- Objects are never cloned automatically
- References are preserved unless replaced
- Arrays remain arrays
- Entities are indexed recursively
- Cycles are supported
- `.get()` always returns a cursor
- `.value()` returns the raw value
- Missing entities throw runtime errors
