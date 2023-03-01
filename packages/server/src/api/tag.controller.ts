import { Context } from "koa";
import Debug from "@bernese/shared/src/debug";
import fsPromise from "fs/promises";
import { ok } from "./util";

const debug = Debug();

type addTagReqBody = {
  paths: string | string[];
  tag: string;
  category: string;
};
export async function addTag(ctx: Context) {
  const { paths, tag, category } = ctx.request.body as addTagReqBody;
  // for (const p of typeof paths === "string" ? [paths] : paths) {
  //   if (p.startsWith("/")) {
  //     const st = await fsPromise.stat(p);
  //     if (st.isDirectory()) {
  //       const dir = await BDir.fromPath(p);
  //       await dir.addTag(tag, category);
  //     } else if (st.isFile()) {
  //       const file = await BFile.fromPath(p);
  //       await file.addTag(tag, category);
  //     } else {
  //       ctx.throw(400, `unknown resource:  ${p}`);
  //     }
  //   } else if (p.startsWith("http")) {
  //   }
  //   if (!p.startsWith("/")) {
  //     const msg = `invalid resource: ${p}`;
  //     debug("add tag :", msg);
  //     ctx.throw(400, msg);
  //   }
  // }
  ctx.body = ok();
}
