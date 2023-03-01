import Debug from "debug";
import assert from "assert";

const debug = Debug("b:server:index:test");

test("import absolute path", () => {
  assert.strictEqual("db", "db", "absolute path not work in jest test");
});
