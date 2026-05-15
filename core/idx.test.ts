import { describe, expect, test } from "bun:test";
import { idx } from "./idx";

describe("idx", () => {
  test("traverses deeply nested properties", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "hero-1",

          title: {
            uuid: "title-1",
            value: "Hello",
          },
        },
      ],
    };

    const title = idx(document).get("sections").get(0).get("title").value();

    expect(title.value).toBe("Hello");
  });

  test("finds entities recursively from current cursor", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "hero-1",

          title: {
            uuid: "title-1",
            value: "Hello",
          },
        },

        {
          uuid: "hero-2",

          title: {
            uuid: "title-2",
            value: "World",
          },
        },
      ],
    };

    const section = idx(document).get("sections").find("hero-2").value();

    expect(section.uuid).toBe("hero-2");
  });

  test("updates deeply nested values", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "hero-1",

          title: {
            uuid: "title-1",
            value: "Hello",
          },
        },
      ],
    };

    idx(document)
      .get("sections")
      .find("title-1")
      .set((title) => ({
        ...title,
        value: "Updated",
      }));

    expect(document.sections[0]?.title.value).toBe("Updated");
  });

  test("mutates original references", () => {
    const title = {
      uuid: "title-1",
      value: "Hello",
    };

    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "hero-1",
          title,
        },
      ],
    };

    idx(document)
      .get("sections")
      .find("title-1")
      .set((title) => {
        title.value += " World";

        return title;
      });

    expect(title.value).toBe("Hello World");

    expect(document.sections[0]?.title).toBe(title);
  });

  test("replaces arrays", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "a",
        },

        {
          uuid: "b",
        },
      ],
    };

    idx(document)
      .get("sections")
      .set(() => []);

    expect(document.sections).toEqual([]);
  });

  test("filters arrays", () => {
    const document = {
      uuid: "root",

      sections: [
        {
          uuid: "a",
        },

        {
          uuid: "b",
        },
      ],
    };

    idx(document)
      .get("sections")
      .set((sections) => sections.filter((section) => section.uuid !== "a"));

    expect(document.sections).toEqual([
      {
        uuid: "b",
      },
    ]);
  });

  test("supports deep realistic menu structures", () => {
    const menu = [
      {
        uuid: "menu-1",

        categories: [
          {
            uuid: "pizza",

            items: [
              {
                uuid: "margherita",
                title: "Pizza Margherita",
                price_cents: 1200,
              },

              {
                uuid: "salami",
                title: "Pizza Salami",
                price_cents: 1400,
              },
            ],
          },

          {
            uuid: "dessert",

            items: [
              {
                uuid: "tiramisu",
                title: "Tiramisu",
                price_cents: 800,
              },
            ],
          },
        ],
      },
    ];

    idx(menu)
      .find("menu-1")
      .get("categories")
      .find("dessert")
      .get("items")
      .find("tiramisu")
      .set((item) => ({
        ...item,
        price_cents: 900,
      }));

    expect(menu[0]?.categories[1]?.items[0]?.price_cents).toBe(900);
  });

  test("supports cyclic structures", () => {
    const node: any = {
      uuid: "node",
      value: "A",
    };

    node.self = node;

    const value = idx(node).find("node").value();

    expect(value.value).toBe("A");
  });

  test("throws for missing entities", () => {
    const document = {
      uuid: "root",
    };

    expect(() => {
      idx(document).find("missing");
    }).toThrow("Missing entity: missing");
  });
});
