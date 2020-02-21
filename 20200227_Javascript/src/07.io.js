const { tagged } = require("daggy");

const IO = tagged("IO", ["run"]);

IO.prototype.map = function(f) {
  return IO((...args) => t(this.run(...args)));
};

IO.prototype.chain = function(f) {
  return IO(() => f(this.run()).run());
};

IO.of = x => IO(() => x);

console.log(IO.of(50).run());

module.exports = {
  IO
};
