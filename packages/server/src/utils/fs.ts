import Debug from "@bernese/shared/src/debug";
import fs from "fs";
import fsPromise from "fs/promises";

export { existsSync, mkdirSync, copyFileSync } from "fs";
const debug = Debug();

export function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readTextFileSync(path: string) {
  return fs.readFileSync(path, { encoding: "utf8" });
}

export function writeTextFileSync(path: string, content: string) {
  return fs.writeFileSync(path, content, { encoding: "utf8" });
}

export function accessFile(path: string): Promise<boolean> {
  return fsPromise
    .access(path, fsPromise.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
