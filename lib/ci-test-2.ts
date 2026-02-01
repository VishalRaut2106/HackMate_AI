// This file is INTENTIONALLY broken to test the CI workflow.
// It has a type error (assigning string to number).

const testVariable: number = "this should fail the build";

export function failureTest() {
  console.log(testVariable);
}
