import Debug from "debug";
import assert from "assert";
import { name } from "@/db";

const debug = Debug("b:server:index:test");

test("import absolute path", () => {
  debug(name);
  assert.strictEqual(name, "db", "absolute path not work in jest test");
});
