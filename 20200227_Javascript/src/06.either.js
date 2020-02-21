const { taggedSum } = require("daggy");
const util = require("util");

const Either = taggedSum("Either", {
  Left: ["error"],
  Right: ["value"]
});

const { Left, Right } = Either;

Either.prototype[util.inspect.custom] = function() {
  return this.cata({
    Left: error => `Left(${error})`,
    Right: value => `Right(${value})`
  });
};

Either.prototype.map = function(f) {
  return this.cata({
    Left: _ => this,
    Right: val => Either.Right(f(val))
  });
};

Either.prototype.chain = function(f) {
  return this.cata({
    Left: _ => this,
    Right: val => f(val)
  });
};

Either.prototype.fold = function(f, g) {
  return this.cata({
    Left: f,
    Right: g
  });
};

Either.of = Either.Right;

console.log(Either.of(50));
console.log(Left(30));

module.exports = {
  Either
};
