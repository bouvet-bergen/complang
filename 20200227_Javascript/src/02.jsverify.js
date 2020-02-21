const { property } = require("jsverify");

const compose = (g, f) => x => g(f(x));

const Box = value => ({
  value,
  map: f => Box(f(value)),
  equals: other => value === other.value
});

describe("Box", () => {
  property("Identity", "nat", val => {
    const equationLeft = Box(val);
    const equationRight = Box(val).map(x => x);

    return equationLeft.equals(equationRight);
  });

  property("Composition", "nat -> nat", "nat -> nat", "nat", (f, g, val) => {
    const equationLeft = Box(val)
      .map(f)
      .map(g);
    const equationRight = Box(val).map(compose(g, f));

    return equationLeft.equals(equationRight);
  });
});
