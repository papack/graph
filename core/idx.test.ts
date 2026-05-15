import { describe, expect, test } from "bun:test";
import { idx } from "./idx";

describe("idx", () => {
  test("reads nested entity values", () => {
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

    const title = doc.get("hero-1").get("content").get("title").value();

    expect(title.value).toBe("Hello");
  });

  test("updates values by mutation", () => {
    const document = {
      uuid: "root",

      title: {
        uuid: "title-1",
        value: "Hello",
      },
    };

    const doc = idx(document, "uuid");

    doc.get("title-1").set((title) => {
      title.value += " World";

      return title;
    });

    expect(document.title.value).toBe("Hello World");
  });

  test("replaces values immutably", () => {
    const document = {
      uuid: "root",

      title: {
        uuid: "title-1",
        value: "Hello",
      },
    };

    const doc = idx(document, "uuid");

    doc.get("title-1").set((title) => ({
      ...title,
      value: "Replaced",
    }));

    expect(document.title.value).toBe("Replaced");
  });

  test("replaces arrays", () => {
    const document = {
      uuid: "root",

      gallery: {
        uuid: "gallery-1",

        images: ["a", "b", "c"],
      },
    };

    const doc = idx(document, "uuid");

    doc
      .get("gallery-1")
      .get("images")
      .set(() => []);

    expect(document.gallery.images).toEqual([]);
  });

  test("filters arrays", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "hero-1",
        },

        {
          uuid: "hero-2",
        },
      ],
    };

    const doc = idx(document, "uuid");

    doc
      .get("sections")
      .set((sections) =>
        sections.filter((section) => section.uuid !== "hero-1"),
      );

    expect(document.sections).toHaveLength(1);
    expect(document.sections[0]!.uuid).toBe("hero-2");
  });

  test("preserves object references when mutating", () => {
    const title = {
      uuid: "title-1",
      value: "Hello",
    };

    const document = {
      uuid: "root",
      title,
    };

    const doc = idx(document, "uuid");

    doc.get("title-1").set((t) => {
      t.value = "Updated";

      return t;
    });

    expect(document.title).toBe(title);
  });

  test("replaces object references when returning new object", () => {
    const title = {
      uuid: "title-1",
      value: "Hello",
    };

    const document = {
      uuid: "root",
      title,
    };

    const doc = idx(document, "uuid");

    doc.get("title-1").set((t) => ({
      ...t,
      value: "Updated",
    }));

    expect(document.title).not.toBe(title);
    expect(document.title.value).toBe("Updated");
  });

  test("supports multiple entity keys", () => {
    const document = {
      id: "root",

      child: {
        uuid: "child-1",
        value: 123,
      },
    };

    const doc = idx(document, ["id", "uuid"]);

    expect(doc.get("child-1").value().value).toBe(123);
  });

  test("throws on missing entities", () => {
    const document = {
      uuid: "root",
    };

    const doc = idx(document, "uuid");

    expect(() => {
      doc.get("missing");
    }).toThrow("Missing entity: missing");
  });

  test("supports cycles", () => {
    const node: any = {
      uuid: "node-1",
      value: 1,
    };

    node.self = node;

    const doc = idx(node, "uuid");

    expect(doc.get("node-1").value().value).toBe(1);
  });

  test("supports direct property traversal", () => {
    const document = {
      uuid: "root",

      content: {
        title: {
          value: "Hello",
        },
      },
    };

    const doc = idx(document, "uuid");

    const title = doc.get("content").get("title").value();

    expect(title.value).toBe("Hello");
  });

  test("returns raw references from value()", () => {
    const title = {
      uuid: "title-1",
      value: "Hello",
    };

    const document = {
      uuid: "root",
      title,
    };

    const doc = idx(document, "uuid");

    expect(doc.get("title-1").value()).toBe(title);
  });

  test("supports root mutation", () => {
    const document = {
      uuid: "root",
      value: 1,
    };

    const doc = idx(document, "uuid");

    doc.set((root) => {
      root.value = 2;

      return root;
    });

    expect(document.value).toBe(2);
  });

  test("supports deep nested arrays and objects", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "section-1",

          blocks: [
            {
              uuid: "block-1",

              data: {
                uuid: "data-1",
                value: "deep",
              },
            },
          ],
        },
      ],
    };

    const doc = idx(document, "uuid");

    expect(doc.get("data-1").value().value).toBe("deep");
  });

  test("updates deeply nested entities", () => {
    const document = {
      uuid: "root",

      nested: {
        uuid: "nested-1",

        value: {
          uuid: "value-1",
          text: "Hello",
        },
      },
    };

    const doc = idx(document, "uuid");

    doc.get("value-1").set((value) => {
      value.text = "Updated";

      return value;
    });

    expect(document.nested.value.text).toBe("Updated");
  });

  test("supports array entity lookup", () => {
    const document = {
      uuid: "root",

      items: [
        {
          uuid: "a",
          value: 1,
        },

        {
          uuid: "b",
          value: 2,
        },
      ],
    };

    const doc = idx(document, "uuid");

    expect(doc.get("a").value().value).toBe(1);
    expect(doc.get("b").value().value).toBe(2);
  });

  test("can replace nested arrays with new arrays", () => {
    const document = {
      uuid: "root",

      items: {
        uuid: "items-1",

        values: [1, 2, 3],
      },
    };

    const doc = idx(document, "uuid");

    doc
      .get("items-1")
      .get("values")
      .set((values) => [...values, 4]);

    expect(document.items.values).toEqual([1, 2, 3, 4]);
  });

  test("indexes newly replaced entities", () => {
    const document = {
      uuid: "root",

      child: {
        uuid: "child-1",
        value: "old",
      },
    };

    const doc = idx(document, "uuid");

    doc.get("child-1").set(() => ({
      uuid: "child-2",
      value: "new",
    }));

    expect(doc.get("child-2").value().value).toBe("new");
  });

  test("throws after entity removal", () => {
    const document = {
      uuid: "root",

      items: [
        {
          uuid: "a",
        },
      ],
    };

    const doc = idx(document, "uuid");

    doc.get("items").set(() => []);

    expect(() => {
      doc.get("a");
    }).toThrow();
  });
});
