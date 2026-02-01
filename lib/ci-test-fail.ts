// This file is INTENTIONALLY broken to test the CI workflow.
// It has a type error (assigning string to number).

const brokenMath: number = "this is not a number";

export function tryToBuild() {
  console.log(brokenMath);
}
