const { Maybe } = require("./04.maybe");
const { property } = require("jsverify");

const { Just, Nothing } = Maybe;

describe("Maybe", () => {
  property("Just - left identity", "nat", "nat -> nat", (val, f) => {
    const F = val => Just(f(val));

    const leftEquation = Maybe.of(val).chain(F);

    const rightEquation = Maybe.of(val)
      .chain(Maybe.of)
      .chain(F);

    return leftEquation.equals(rightEquation);
  });

  property("Just - left identity", "nat", "nat -> nat", (val, f) => {
    const F = x => Just(f(x));

    const leftEquation = Maybe.of(val).chain(F);
    const rightEquation = Maybe.of(val)
      .chain(F)
      .chain(Maybe.of);

    return leftEquation.equals(rightEquation);
  });

  // same thing for Nothing
  property("Nothing - left identity", "nat", "nat -> nat", (val, f) => {
    const F = val => Just(f(val));

    const leftEquation = Nothing.chain(F);

    const rightEquation = Nothing.chain(Maybe.of).chain(F);

    return leftEquation.equals(rightEquation);
  });

  property("Nothing - right identity", "nat", "nat -> nat", (val, f) => {
    const F = x => Just(f(x));

    const leftEquation = Nothing.chain(F);
    const rightEquation = Nothing.chain(F).chain(Maybe.of);

    return leftEquation.equals(rightEquation);
  });
});
