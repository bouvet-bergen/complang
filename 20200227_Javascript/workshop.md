# Intro

This workshop will try to explain some of the basic data structures used in FP, essentially _functors_ and _monads_, by following a spec for algebraic data types in javascript called _fantasy-land_. We will be doing this in the Node.js environment, because it already has support for many new language features and by default it's easier to setup.

This workshop is heavily inspired and takes references and parts of implementation from:

- [Professor Frisby's Mostly Adequate Guide To Functional Programming](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/ "Professor Frisby's Mostly Adequate Guide To Functional Programming")
- [Professor Frisby Introduces Composable Functional JavaScript](https://egghead.io/courses/professor-frisby-introduces-composable-functional-javascript/ "Professor Frisby Introduces Composable Functional JavaScript")
- [Classroom Coding With Professor Frisby](https://www.youtube.com/watch?v=h_tkIpwbsxY "Classroom Coding With Professor Frisby")
- [Fantasy Land series by Tom Harding](http://www.tomharding.me/fantasy-land/ "Fantasy Land")

# ADT in Javascript

Functional programming is all about functions (right?).
The idea is to describe your program in different pure functions and values, which will be used and run at the very end.

Let's take a look at a simple program which calculates the acronym for a string (takes the first char from every word and uppercases it):

```js
const getAcronym = str => {
  const trimmed = str.trim();
  const words = trimmed.split(" ");
  const letters = words.map(word => word[0]);
  const uppercased = letters.map(letter => letter.toUpperCase());
  return uppercased.join("");
};

const result = getAcronym("Comp Lang Rules");
```

This program is highly imperative - and if we squint a bit we can see that there's a logical sequence of steps, trimming a string, splitting it by a space, getting every letter from every word, uppercasing them and then joining them in the end. And all the time we're adding temporary variables and local state just to somehow give a name to the step we're working on. This is pretty noisy.

Wouldn't it be better to somehow lose all these intermediate variables and dot chain all of these transformation onto one value?
Let's think more general, not just dot.chaining on a string, like `str.trim().split(' ').map(...)`, but also on any kind of value.

This is where _Functors_ come into play.

We can define a factory function called Box, which will be a container for our value (for those not used to newer JS syntax and features, this function accepts one parameter, _value_, and returns an object with the property _value_).

```js
const Box = value => ({
  value
});
```

We now need a way to operate on this value somehow - we can give add a function to this object, called, transformValue - where we can give it a function which will take this value and do something with it.

```js
const Box = value => ({
  value,
  transformValue: f => f(value)
});
```

If we return the result of this function, it is quite possible that we will lose the capability of chaining - that is why this operation should be _CLOSED_ - meaning _transformValue_ should return a new instance of the Box.

```js
const Box = value => ({
  value,
  transformValue: f => Box(f(value))
});
```

In the functional programming world, the transformValue function is called _map_. What happens if we try to refactor this function into using a box.

```js
const Box = value => ({
  value,
  map: f => Box(f(value))
});
const getAcronym = str =>
  Box(str)
    .map(s => s.trim())
    .map(trimmed => trimmed.split(" "))
    .map(words => words.map(word => word[0]))
    .map(letters => letters.map(letter => letter.toUpperCase()))
    .map(letters => letters.join("")).value;
```

We can see that all these functions are actually util functions that we can refactor out, or use from a standard library - trim, toUpperCase, split, etc.

```js
const Box = value => ({
  value,
  map: f => Box(f(value))
});
const trim = str => str.trim();
const split = by => str => str.split(by);
const toUpperCase = str => str.toUpperCase();
const map = fn => xs => xs.map(fn);
const get = index => xs => xs[index];

const getAcronym = str =>
  Box(str)
    .map(trim)
    .map(split(" "))
    .map(words => words.map(get(0)))
    .map(letters => letters.map(toUpperCase))
    .map(letters => letters.join("")).value;

// or , if we try to do it fully pointfree
const getAcronym = str =>
  Box(str)
    .map(trim)
    .map(split(" "))
    .map(map(get(0)))
    .map(map(toUpperCase))
    .map(join("")).value;
```

In the functional programming jargon, a Box container or context is actually called an Identity functor.
So, what is a functor?

A Functor is, for our purposes, an _interface_ that a certain class / object implements, and that interface contains a method called _map_.

This function will:

1. accept a function
2. apply the function to the value inside the functor/context
3. return a new instance of the context with the result

The first and foremost example for a functor is a list/js array. As we saw in the example, we were able to transform the elements of an array directly with map. If we used an array with a single element, it would behave identically to the box:

```js
const trim = str => str.trim();
const split = by => str => str.split(by);
const toUpperCase = str => str.toUpperCase();
const map = fn => xs => xs.map(fn);
const get = index => xs => xs[index];

// or , if we try to do it fully pointfree
const getAcronym = str =>
  [str]
    .map(trim)
    .map(split(" "))
    .map(map(get(0)))
    .map(map(toUpperCase))
    .map(join(""))[0];
```

What a functor does is actually abstracting function application - we're not calling directly the functions we're providing, somebody else is - the functor.

But, a functor isn't a functor if it doesn't follow certain laws - these laws are very important since they help us reason about the behaviour of our code.

_Functor_ interface has 2 laws:

1. identity
2. composition

# Identity law

Identity law states that if we have a value inside a functor context and if we _map_ it to an identity function (x => x), we're supposed to get the exact same value inside the same container.

```
Box(5) == Box(5).map(x => x)
```

# Composition law

Composition law states that if we have a value inside a functor context, we map it to a function f, then we map the new value and context to a function g, that it should be completely identical to mapping the value to a composed g ∙ f function.

```
Box(5).map(f).map(g) == Box(5).map(compose(g, f))
```

# Test all the laws

How do we test these laws? By using something called property testing. In essence, property testing means generating a bunch of values, testing if a certain proposition/law works for them (like the laws we mentioned up).

jsVerify is one of the libraries used for writing property tests in javascript.

This library has a ton of helper functions and generators for doing property testing, and for finding the minimal input for the proposition to fail (usually edge cases, 0, out of bounds etc)

# jsverify example

To run this example, run `npm test -- 02.jsverify.js`.

```js
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
```

To run this example

These property tests will generate 100 cases with random values defined in the property (_nat_ means a natural number, _string_ string, _nat -> nat_ a function which accepts a nat and returns a nat etc.)

# Ok, but what are these structures useful for?

These structures are useful for when we need to add additional functionality or give our value a more _specific_ context.

Here's an example - What if didn't provide value to the _getAcronym_ or it was undefined - it would be really nice if our context structure could somehow denote that the value is missing and just ignore the functions being applied to it.

Enter ... _Maybe_.

# Maybe / Optional

Maybe (or in some languages called Optional) is a data structure which can contain a certain value, but also can represent the lack of it.

Maybe data structure is an instance of the _Functor_ interface, meaning that it has a function called _map_.

How can we implement a structure like that?

# Algebraic Data Types

A small detour.

What is an algebra?

An algebra is a set of elements together with a set of operations. For example, addition on integers forms a very simple algebra, where the elements are integers, and the sole operation is addition. But an algebra also follows some laws (addition being commutative and associative).

What are ADTs?

ADTs are types composed from _product_ types and _sum_ types. The reason why they're called algebraic is that when looking at the _cardinalities_ of these types, they form a certain algebra (therefore _sum_ and _product_).

## Product types

Product types are what we encounter in our daily life as a developer most often - _objects_ or _records_.
Why are they called products?
Because the possible number of instances (cardinality) for this type is a product of the number of instances of properties.

e.g.

```js
{
    id,
    name,
    address,
}
// cardinality of id * cardinality of name * (cardinality of street * cardinality of ...)
```

## Sum types

Sum types are what we encounter in daily life as _enumerations_ - with a catch that our enumerations can also contain a _payload_ - this can be any other type.

The simplest example would be a _Bool_ type. It has two values, _True_ and _False_. The cardinality of this type is 2.

Another example would be possible outcomes for a comparison function, let's call it Comparison: LT, EQ, GT. Cardinality is 3.

Another example would be an _abstract_ class of shapes: a circle (defined with a center point and radius), rectangle (defined by topleft and bottomRight).

If a sum type contains a payload, this payload can be any other type. What happens if our two variants have the same type:
string | string? We need to somehow put a _tag_ on each variant, so that we actually know which one it is - that's why these are called _tagged unions_.

## Pattern matching

Pattern matching is a language construct (in some languages) or a function which gives us an opportunity to execute different code depending on what a certain type is (what kind of value, or variant or inner type etc).
Javascript doesn't have pattern matching, only simple switch case statements.

# daggy

Daggy.js is a library in javascript for writing _product_ and _sum_ types in a bit easier way, since javascript doesn't support types and doesn't have any typechecking, typechecking in daggy is done at runtime.

```js
const { tagged } = require("daggy");

// this way we define a constructor for an object with three properties, x, y, z
const Point = tagged("Point", ["x", "y", "z"]);
```

````js
const { taggedSum } = daggy;

const Shape = taggedSum("Sum", {
  Rectangle: ["topLeft", "bottomRight"], // these are called data constructors
  Circle: ["centre", "radius"]
  // this way we defined a constructor for an object which can either be a square or a circle.```
});
````

## pattern matching

Pattern matching in daggy is done by using the _cata_ method on the instance of the type:

```js
const circle = Shape.Circle(Point(0, 0), 10)
...
Shape.prototype.circumference = function(f) {
  return this.cata({
    Rectangle: (topLeft, bottomRight) =>
      2 *
      (Math.abs(topLeft.x - bottomRight.x) +
        Math.abs(topLeft.y - bottomRight.y)),
    Circle: (center, radius) => 2 * radius * Math.PI
  });
};
```

# Missing values / Null pointer exceptions

Back to the main topic: for handling situations where a value might be missing, we use a data structure called _Maybe_.

```js
const Maybe = taggedSum("Maybe", {
  Nothing: [], // when a constructor doesn't have parameters, it's working as a constant
  Just: ["value"]
});

const just = Maybe.Just(5);
const nothing = Maybe.Nothing;
```

Since _Maybe_ is a functor, we need to define a _map_ function on it:

```js
Maybe.prototype.map = function(f) {
  return this.cata({
    Nothing: _ => Nothing, // If the value doesn't exist, just skip the map
    Just: value => Just(f(value)) // If the value exists, apply a function to it and return within the context - *CLOSED*
  });
};
```

# Usage

Where can we use a data structure like _Maybe_?

The simplest example in javascript would be to safely get the value of a property from an object.

```js
// safeProp :: String -> Any -> Maybe Any
const safeProp = key => obj =>
  obj[key] == null ? Maybe.Nothing : Maybe.Just(obj[key]);
```

The one thing that is useful with these data structures is that they force you to think in a different way - not by imperatively mainpulating values and moving them around, but by actually defining data flows and how to handle edge cases of those data flows, like missing values, exceptions, asynchronicity etc.

## Smart constructors

Smart constructor is a pattern which is often used when trying to construct a complex value/object.
Often, we need to validate the input parameters:

```js
const makePerson = (name, age) => ({
  name,
  age
});

const newPerson = makePerson("", -20); // this allows for a pretty perfect person, when it comes to the code
```

```js
const makePerson = (name, age) => {
  if(name === '') {
    return Maybe.Nothing
  }
  if(typeof age !== 'number' || age <= 0) {
    return Maybe.Nothing
  }

  return Maybe.of({
    name,
    age
  })
})
```

This way we are telling the caller that he needs to take care of the input and in a way we propagate the decision to the caller.

## Print pretty

In order to have a prettier output in the console, we should overwrite a function in Node dedicated to stringifying and object.

We can do it like this:

```js
const util = require('util')
...
Maybe.prototype[util.inspect.custom] = function() {
  return this.cata({
    Nothing: _ => "Maybe.Nothing",
    Just: val => `Maybe.Just(${val})`
  });
};
```

# Chain

What happens if we want to get a property from within a property (by using the same safeProp function)?

```js
const obj = {
  id: 0,
  name: "Dusan",
  address: {
    street: "Ny-Paradis",
    number: 62
  }
};

const maybeAddress = safeProp("address")(obj);

// our address is inside of a Maybe context, the only way to go forward is to map

const maybeMaybeStreet = maybeAddress.map(address =>
  safeProp("street")(address)
);
// what we get now is Maybe.Just(Maybe.Just('Ny-Paradis'))
```

Here, we get to a term of _Monad_.

What monads give us is a capability to _chain_ complex computations that result in monads of the same type.
A Monad is:

1. a functor (has _map_)
2. has an _of_ static method

```js
Maybe.of = x => Maybe.Just(x);

// or simply

Maybe.of = Maybe.Just;
```

3. has a _chain_ method

```js
Maybe.prototype.chain = function(f) {
  return this.cata({
    Nothing: _ => Nothing,
    Just: val => f(val)
  });
};
```

What the _chain_ method does is that it uses the value from the context, calculates a new context from it and strips one layer or _joins_ the _contexts_ into one. So, if we use the previous example:

```js
const maybeStreet = maybeAddress.chain(address => safeProp("street")(address));
```

This way, we are able to nest as many complex computations (some call them effectful) into one.

# of

Maybe.of static method is used to _put the value in the minimal context_. In case of Maybe, it's just shortcut to _Maybe.Just_.

Why do we need _of_? Because _monads_ have additional laws which they must obey.

1. left identity

```
Maybe(x).chain(f) == Maybe(x).chain(Maybe.of).chain(f)
```

2. right identity

```
Maybe(x).chain(f) == Maybe(x).chain(f).chain(Maybe.of)
```

These laws essentially mean that if we chain the Maybe.of function (which returns an instance of Maybe) to before or after chaining an effectful computation, the result must be the same.

Note: to run the spec, run `npm test -- src/05.maybe.spec.js`

```js
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
  // ...
});
```

# When do we _extract_ the value?

In FP, the idea is to try to pack all of computations into functions and data structures like Maybe, and _extract_ the value from the context only at the very end, when we need the result.

In FP jargon, the function which _reduces_ the value from the context is called _fold_.

```js
Maybe.prototype.fold = function(f, g) {
  return this.cata({
    Nothing: f,
    Just: g
  });
};
```

This way, if we need the result, we are providing two functions, one for the lack of value, and one for possible existence of it.

```js
const result = maybeStreet.fold(
  () => "No address provided!",
  address => `The address is ${address}`
);
```

# Error handling

For capturing the notion of an error, we use a data structure called _Either_. This is a data structure which has two possible outcomes: _Left_ and _Right_ (in Elm it's called _Ok_ and _Error_, different in some other languages).

Here's a basic definition of the Either data type.

```js
const Either = taggedSum("Either", {
  Left: ["error"],
  Right: ["value"]
});
```

Since _Either_ is a functor, it means that it must implement the method _map_

```js
Either.prototype.map = function(f) {
  return this.cata({
    Left: _ => this,
    Right: val => Either.Right(val)
  });
};
```

As we can see, this data type is quite similar to _Maybe_ - we are always ignoring the _error_ branch, or we're always returning the same error.

_Either_ is also a _monad_, meaning that it must implement the functions _chain_ and a static function _of_

```js
Either.prototype.chain = function(f) {
  return this.cata({
    Left: _ => this,
    Right: val => f(val)
  });
};
```

Either.map is essentially the same as Maybe.map.

```js
Either.of = Either.Right;
```

Same as with Maybe, we are putting the value in the _minimal viable context_. If we used the _Either.Left_, the laws for monads wouldn't hold.

# Side effects

By default, functional programming in languages like Haskell forces you to write pure functions - side effects are not allowed.
How can we emulate a similar thing in javascript?

The simplest way to avoid running a side-effectful procedure is - to wrap it in a function!

Enter ... IO.

# IO

IO can be a structure which wraps an effectful computation into it and has all the interfaces as other monads we've encountered.

```js
const IO = tagged("IO", ["run"]);
```

IO is a functor, it implements map. But how do we get a value which is calculated inside a function? We run it:D But, remember, since _map_ is closed, it needs to return the same structure, meaning that somehow we have to wrap the effectful computation again.

```js
IO.prototype.map = function(f) {
  return IO((...args) => t(this.run(...args)));
};
```

IO is a monad, it implements chain.

```js
IO.prototype.chain = function(f) {
  return IO(() => f(this.run()).run());
};
```

and of.

```js
IO.of = x => IO(() => x);
```

What we can see from the IO monad is that it is a _synchronous effect_ and also _without information about the error_.

# Asynchronicity

In FP styled Javascript we handle asynchronicity with a _Task_ structure.

```js
const Task = tagged("Task", ["fork"]);
```

_fork_ is a function which accepts two callbacks: _rej_ and _res_ (similar to how a _Promise_ is made).

```js
const timeoutTask = Task((rej, res) => {
  setTimeout(() => {
    res(500);
  }, 500);
});
```

We execute the task by calling the fork function:

```js
timeoutTask.fork(console.error, console.log);
```

_Task_ is a _functor_, it implements map. Similar to IO, since it's a function, we need to wrap the execution in a new Task context.

```js
Task.prototype.map = function(f) {
  return Task((rej, res) => this.fork(rej, x => res(f(x))));
};
```

_Task_ is a monad, it implements _chain_:

```js
Task.prototype.chain = function(f) {
  return Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res)));
};
```

and _of_:

```js
Task.of = x => Task((rej, res) => res(x));
```

There is one helper function which we can make, which isn't covered by any _interface_, and that's the _rejected_ - if we need to fail the computation:

```js
Task.rejected = x => Task((rej, res) => rej(x));
```

As we can see both with _IO_ and _Task_ - no computation is executed! We are esentially just layering / composing functions on top of each other, and only when we're executing the _fork_ function, these mapped/chained functions are executed.

## Promise vs Task

We can see from the definition of _Task_ that is quite similar to _Promise_ values. But the key difference is - Task is lazy!
Task is executed when _fork_ is called, while Promises are executed immediately.

One example where we could use a Task would be fetching a resource from an api - we could wrap the fetch function inside a Task:

```js
const fetchJson = (...args) =>
  Task((rej, res) =>
    fetch(...args)
      .then(x => x.json())
      .then(res)
      .catch(rej)
  );
```

_fetchJson_ returns a task which we could use to chain additional computations. e.g. If we need to make a new api call depending on the results from the current one:

```js
const studentId = 12345
const task = fetchJson(`/students/${id}`)
    .chain(student => fetchJson(student.choosenClassesUrl))
    .map(...)
```

Of course, the fetchJson function has its limitations, it needs to be refactored/made more bulletproof - but in this way, you're explaining what your task should do and moving the decision about what to do more up in the architecture - the caller must decide about the error / success paths.

# Combining different contexts

## Same contexts

By now, we have covered many different effects/contexts that we can have in our app - missing values, error in computation, side effects, asynchronicity etc.

But what happens if we need to combine values from different contexts - as in call a function on the results of two different Tasks? Or two different IOs?

We cannot use _map_ with a function that returns a function (curried), because that would return a context with a _function inside_:

```js
Maybe.of(10).map(x => y => x + y); // results in a Maybe(y => 10 + y)
```

This is where an _interface_ called _Apply_ comes in.

## Apply

What this interface gives us is the possibility that our context contains a function and with want to _apply_ it to the same context with a value. How can we write this for a _Maybe_ type?

```js
Maybe.prototype.ap = function(other) {
  return this.cata({
    Nothing: _ => Nothing, // remember, if we don't have a function in this context, we can't do anything - the most logical thing is to return Nothing
    Just: f => other.map(f) // the *other* is essentially a context, we have access to the function, we can just apply it via map
  });
};
```

This way, our previous computation can be:

```js
Maybe.of(10)
  .map(x => y => x + y)
  .ap(Maybe.of(20));
```

This means that if we had values from two different computations, wrapped in a context , we can combine them with a function by using the _ap_ method. Essentially, the process of making a function work with contexts is called _lifting_, and we have a method called _lift2_ (for 2 parameters), _lift3_, _lift4_ etc. NOTE: Remember that the function provided to lift must be curried - so that when doing _map_ it will result in another function (wrapped in context)

```js
Maybe.lift2 = (f, a, b) => a.map(f).ap(b);
Maybe.lift3 = (f, a, b, c) =>
  a
    .map(f)
    .ap(b)
    .ap(c);
```

Either implementation:

```js
Either.prototype.ap = function(other) {
  return this.cata({
    Left: err => this,
    Right: f => other.map(f)
  });
};
```

IO implementation:

```js
IO.prototype.ap = function(other) {
  return IO(() => other.map(this.run()).run());
};
```

Task implementation:

```js
Task.prototype.ap = function(other) {
    return Task((rej, res) => this.fork(rej, f => other.map(f).fork(rej, res))
}
```

# Combining different context layers

What happens if we come upon a situation where we have two layers of context, but of different type?
E.g. Task(Either Error OurData)? This could be a very common situation, since we would be using a Task to fetch data from API, and in case the data is invalid (something wrong with the result; decoding not working propertly).

If we need to map the result, then we would have to map twice, since the data inside the task is an either. But what happens if we need to chain - we need to make an additional api fetch depending on the data?

```js
const task = fetchJson(`/students/${id}`)
    .map(checkIfValid) // checks if student data is valid
    .map(eitherStudent => eitherStudent.map(student => fetchJson(student.choosenClassesUrl)) // we end up with a pretty complicated structure - Task(Either Error (Task Error ClassesData))
    .map(...)
```

As we can see, this combination gets pretty tiresome.

## Natural transformations

Natural transformations are mappings between functors - it is a function from a context containing some data into another context containing the same data. These don't have to preserve all data - e.g. eitherToMaybe natural transformation would loose the error part. Usually, we would use these to switch to a more "generic" type, such as Task, which has the notion of asynchronicity, but also the notion of error and success.

Here are implementations of some basic natural transformations between the types that we have

```js
const maybeToEither = m => m.fold(_ => Either.Left, Either.Right);

const maybeToTask = m => m.fold(Task.rejected, Task.of);

const eitherToTask = e => e.fold(Task.rejected, Task.of);
```

So, the example from before:

```js
const task = fetchJson(`/students/${id}`)
    .map(checkIfValid) // checks if student data is valid
    .chain(eitherToTask) // turns an Either into a Task and joins them
    .map(student => fetchJson(student.choosenClassesUrl))
    .map(...)
```

However, we cannot reasonably write a _taskToEither_ natural transformation, because we don't have access to the data inside the Task!
To get that data, we need to _run_/_fork_ the task, and that is an _impure_ action.

## Monad transformers

Monad transformers are outside the scope of this workshop, but let's just say they're a way to add the functionality of one context to another context - it knows how to map/chain the computations. And a monad transformer is on it's own a monad.

This way, we make monad transformer stacks where every layer will add a new sprinkle of functionality:

1. MaybeT - Adds the functionality of missing a value
2. EitherT - Adds the functionality of error
3. StateT - Adds the functionality of state
4. ReaderT - Adds the functionality of shared environment

# Exercises

[Exercises 1](https://next.plnkr.co/edit/eXeSaN1vfYhBhOx6?open=index.js&deferRun=1 "Exercises 1")
[Exercises 2](https://next.plnkr.co/edit/z0yLHE94wnPbyphS?open=index.js&deferRun=1 "Exercises 2")