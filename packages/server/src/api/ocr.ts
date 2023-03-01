import "colors";

import * as cp from "@/utils/cp";

import { bin, dbDirs } from "@/config";

import { Context } from "koa";
import Debug from "@bernese/shared/src/debug";
import Diff from "diff";
import type { File } from "formidable";
import Path from "path";
import fsPromise from "fs/promises";
import mime from "mime-types";
import { ok } from "./util";

const debug = Debug();
export async function ocrImageText(ctx: Context) {
  const { filepath } = ctx.request.files?.["ocr"] as File;
  debug("receive ocr file: %s, mime: %s", filepath, mime.lookup(filepath));
  await ocr(filepath);
  await diff(`${filepath}.tesseract.txt`, `${filepath}.easyocr.txt`);
  ctx.body = ok();
}

async function ocr(file: string) {
  const script = Path.resolve(__dirname, "..", "ocr/main.py");
  console.log(script);
  return cp.execPromise(`"${bin.python} ${script} ${file}"`, {
    cwd: dbDirs.upload(),
    shell: "/bin/zsh",
    timeout: 300 * 1000,
    encoding: "utf8",
  });
}

const diff = async (file1: string, file2: string) => {
  const one = await fsPromise.readFile(file1, { encoding: "utf8" });
  const other = await fsPromise.readFile(file2, { encoding: "utf8" });

  const diff = Diff.diffChars(one, other);

  diff.forEach((part) => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? "green" : part.removed ? "red" : "grey";
    process.stderr.write(part.value[color]);
  });
};
