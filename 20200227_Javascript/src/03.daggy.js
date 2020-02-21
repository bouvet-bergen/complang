const { tagged, taggedSum } = require("daggy");

// this way we define a constructor for an object with three properties, x, y, z
const Point = tagged("Point", ["x", "y"]);

const center = Point(0, 0);
const pointA = Point(10, 10);

const Shape = taggedSum("Sum", {
  Rectangle: ["topLeft", "bottomRight"], // these are called data constructors
  Circle: ["centre", "radius"]
  // this way we defined a constructors for an object which can either be a square or a circle.
});

Shape.prototype.circumference = function(f) {
  return this.cata({
    Rectangle: (topLeft, bottomRight) =>
      2 *
      (Math.abs(topLeft.x - bottomRight.x) +
        Math.abs(topLeft.y - bottomRight.y)),
    Circle: (center, radius) => 2 * radius * Math.PI
  });
};

const circle = Shape.Circle(center, 10);
console.log(circle.circumference());

const square = Shape.Rectangle(Point(0, 10), Point(10, 0));
console.log(square.circumference());
