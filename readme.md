# @papack/graph

Graph access for lists of objects.

`graph()` creates a proxy view over nested arrays containing entities.

Arrays are indexed by a key (`"id"`, `"uuid"`, `"_id"`, etc.) and become directly addressable.

## Installation

```bash id="j8m2q4"
npm install @papack/graph
```

### Example

```ts
import { graph } from "@papack/graph";

const users = [
  {
    uuid: "u1",
    name: "Max",

    posts: [
      {
        uuid: "p1",
        title: "Hello",
      },
    ],
  },
];

const g = graph(users, "uuid");

g["u1"]!.name = "Tom";
g["u1"]!.posts["p1"]!.title = "Updated";
```

All changes mutate the original arrays and objects.

## Access:

```ts
g["u1"]!;
```

## Replacing entities

```ts
g["u1"] = {
  uuid: "u1",
  name: "Tom",
  posts: [],
};
```

Replaces the original entity in the source array.

## Adding entities

```ts
g["u2"] = {
  uuid: "u2",
  name: "Anna",
  posts: [],
};
```

Adds the entity to the original array.

## Deleting entities

```ts
delete g["u1"];
```

Removes the entity from the original array.

## Nested arrays

```ts
g["u1"]!.posts["p1"]!.comments["c1"]!;
```

Nested arrays are indexed recursively.

## Missing entities

Accessing a missing entity throws an error.

```ts
g["missing"];
```

```txt
Error: Entity "missing" not found
```

## TypeScript

```ts
g["u1"]!.posts["p1"]!.title;
```

Nested properties preserve autocomplete and type inference.

## Behavior

- Arrays remain arrays internally
- Access is virtual through `Proxy`
- Objects are never copied
- References are preserved
- Arrays are indexed recursively
- Mutations apply directly to the original objects
- Missing entities throw runtime errors

## API

```ts
graph(value, key);
```

### Parameters

| Name    | Type            | Description                  |
| ------- | --------------- | ---------------------------- |
| `value` | `Array<object>` | Root entity list             |
| `key`   | `string`        | Entity key used for indexing |

#### Example structure

Input:

```ts
[
  {
    uuid: "u1",
  },
];
```
