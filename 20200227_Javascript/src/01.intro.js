const step1 = () => {
  const getAcronym = str => {
    const trimmed = str.trim();
    const words = trimmed.split(" ");
    const letters = words.map(word => word[0]);
    const uppercased = letters.map(letter => letter.toUpperCase());
    return uppercased.join("");
  };

  const result = getAcronym("Comp Lang Rules");

  console.log(result);
};

const step2 = () => {
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

  const result = getAcronym("Comp Lang Rules");

  console.log(result);
};

const step3 = () => {
  const Box = value => ({
    value,
    map: f => Box(f(value))
  });
  const trim = str => str.trim();
  const split = by => str => str.split(by);
  const toUpperCase = str => str.toUpperCase();
  const map = fn => xs => xs.map(fn);
  const get = index => xs => xs[index];
  const join = str => xs => xs.join(str);

  const getAcronym = str =>
    Box(str)
      .map(trim)
      .map(split(" "))
      .map(words => words.map(get(0)))
      .map(letters => letters.map(toUpperCase))
      .map(letters => letters.join("")).value;

  // or , if we try to do it fully pointfree
  const getAcronymPointFree = str =>
    Box(str)
      .map(trim)
      .map(split(" "))
      .map(map(get(0)))
      .map(map(toUpperCase))
      .map(join("")).value;

  const result = getAcronymPointFree("Comp Lang Rules");

  console.log(result);
};

const step4 = () => {
  const trim = str => str.trim();
  const split = by => str => str.split(by);
  const toUpperCase = str => str.toUpperCase();
  const map = fn => xs => xs.map(fn);
  const get = index => xs => xs[index];
  const join = str => xs => xs.join(str);

  // or , if we try to do it fully pointfree
  const getAcronym = str =>
    [str]
      .map(trim)
      .map(split(" "))
      .map(map(get(0)))
      .map(map(toUpperCase))
      .map(join(""))[0];

  const result = getAcronym("Comp Lang Rules");
  console.log(result);
};

step1();
step2();
step3();
step4();
