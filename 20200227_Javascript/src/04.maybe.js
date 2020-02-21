const { taggedSum } = require("daggy");
const util = require("util");

const Maybe = taggedSum("Maybe", {
  Nothing: [],
  Just: ["value"]
});

const { Nothing, Just } = Maybe;

Maybe.prototype.map = function(f) {
  return this.cata({
    Nothing: _ => Nothing,
    Just: value => Just(f(value))
  });
};

Maybe.prototype[util.inspect.custom] = function() {
  return this.cata({
    Nothing: _ => "Maybe.Nothing",
    Just: val => `Maybe.Just(${val})`
  });
};

Maybe.prototype.chain = function(f) {
  return this.cata({
    Nothing: _ => Nothing,
    Just: val => f(val)
  });
};

Maybe.prototype.equals = function(other) {
  return this.cata({
    Nothing: _ => other.is(Nothing),
    Just: val =>
      other.cata({
        Nothing: _ => false,
        Just: otherVal => val === otherVal
      })
  });
};

Maybe.prototype.fold = function(f, g) {
  return this.cata({
    Nothing: f,
    Just: g
  });
};

Maybe.of = Just;

module.exports = {
  Maybe
};

const safeProp = key => obj =>
  obj[key] == null ? Maybe.Nothing : Maybe.Just(obj[key]);

const testSafeProp = () => {
  const obj = {
    address: {
      street: "Hollender gaten",
      number: "52",
      city: "Oslo"
    }
  };

  console.log(safeProp("address")(obj));
};

const smartConstructors = () => {
  const makePerson = (name, age) => {
    if (name === "") {
      return Maybe.Nothing;
    }
    if (typeof age !== "number" || age <= 0) {
      return Maybe.Nothing;
    }

    return Just({
      name,
      age
    });
  };

  console.log(makePerson("Dusan", 30));
  console.log(makePerson("", 30));
  console.log(makePerson("Dusan", -30));
};

const chain = () => {
  const obj = {
    address: {
      street: "Hollender gaten",
      number: "52",
      city: "Oslo"
    }
  };

  const maybeAddress = safeProp("address")(obj);

  console.log(maybeAddress);
  console.log(maybeAddress.map(safeProp("street")));
  console.log(maybeAddress.chain(safeProp("street")));

  const maybeStreet = maybeAddress.chain(safeProp("street"));

  const result = maybeStreet.fold(
    () => "No street provided!",
    street => `The street is ${street}`
  );

  console.log(result);
};

testSafeProp();
smartConstructors();
chain();
