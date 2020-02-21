const { tagged } = require("daggy");

const Task = tagged("Task", ["fork"]);

Task.prototype.map = function(f) {
  return Task((rej, res) => this.fork(rej, x => res(f(x))));
};

Task.prototype.chain = function(f) {
  return Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res)));
};

Task.of = x => Task((rej, res) => res(x));
Task.rejected = x => Task((rej, res) => rej(x));

module.exports = {
  Task
};
