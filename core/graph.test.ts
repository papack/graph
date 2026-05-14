import { describe, expect, test } from "bun:test";
import { graph } from "./graph";

describe("graph", () => {
  test("reads entities by id", () => {
    const users = [
      {
        uuid: "u1",
        name: "Max",
      },
    ];

    const g = graph(users, "uuid");

    expect(g["u1"]!.name).toBe("Max");
  });

  test("mutates original object", () => {
    const users = [
      {
        uuid: "u1",
        name: "Max",
      },
    ];

    const g = graph(users, "uuid");

    g["u1"]!.name = "Tom";

    expect(users[0]!.name).toBe("Tom");
  });

  test("replaces entity", () => {
    const users = [
      {
        uuid: "u1",
        name: "Max",
      },
    ];

    const g = graph(users, "uuid");

    g["u1"] = {
      uuid: "u1",
      name: "Tom",
    };

    expect(users[0]!.name).toBe("Tom");
  });

  test("adds entity", () => {
    const users = [
      {
        uuid: "u1",
        name: "Max",
      },
    ];

    const g = graph(users, "uuid");

    g["u2"] = {
      uuid: "u2",
      name: "Anna",
    };

    expect(users).toHaveLength(2);

    expect(users[1]).toEqual({
      uuid: "u2",
      name: "Anna",
    });

    expect(g["u2"].name).toBe("Anna");
  });

  test("deletes entity", () => {
    const users = [
      {
        uuid: "u1",
        name: "Max",
      },
    ];

    const g = graph(users, "uuid");

    delete g["u1"];

    expect(users).toHaveLength(0);

    expect(() => g["u1"]).toThrow('Entity "u1" not found');
  });

  test("supports nested arrays", () => {
    const users = [
      {
        uuid: "u1",

        posts: [
          {
            uuid: "p1",
            title: "Hello",

            comments: [
              {
                uuid: "c1",
                text: "Nice",
              },
            ],
          },
        ],
      },
    ];

    const g = graph(users, "uuid");

    g["u1"]!.posts["p1"]!.comments["c1"]!.text = "Updated";

    expect(users[0]!.posts[0]!.comments[0]!.text).toBe("Updated");
  });

  test("throws for missing nested entity", () => {
    const users = [
      {
        uuid: "u1",
        posts: [],
      },
    ];

    const g = graph(users, "uuid");

    expect(() => {
      //@ts-expect-error
      g["asdf"]!.posts["asdf"]!.comments["asdf"]!.text = "asdf";
    }).toThrow('Entity "asdf" not found');
  });

  test("preserves array behavior", () => {
    const users = [
      {
        uuid: "u1",
      },
      {
        uuid: "u2",
      },
    ];

    const g = graph(users, "uuid");

    expect(g.length).toBe(2);

    expect(g[0]!.uuid).toBe("u1");

    expect(g.map((x) => x.uuid)).toEqual(["u1", "u2"]);
  });

  test("preserves underlying references", () => {
    const user = {
      uuid: "u1",
      name: "Max",
    };

    const users = [user];

    const g = graph(users, "uuid");

    g["u1"]!.name = "Tom";

    expect(user.name).toBe("Tom");
    expect(users[0]).toBe(user);
  });

  test("returns same proxy instance", () => {
    const users = [
      {
        uuid: "u1",
      },
    ];

    const g = graph(users, "uuid");

    expect(g["u1"]).toBe(g["u1"]);
  });

  test("ignores invalid entity insert", () => {
    const users = [
      {
        uuid: "u1",
      },
    ];

    const g = graph(users, "uuid");

    g["u2"] = {
      uuid: "x",
    };

    expect(users).toHaveLength(1);

    expect(() => g["u2"]).toThrow('Entity "u2" not found');
  });
});
