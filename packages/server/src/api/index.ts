import type { Context, Next } from "koa";

import Debug from "@bernese/shared/src/debug";
import Koa from "koa";
import Router from "@koa/router";
import { dbDirs } from "@/config";
// import { addWebpage } from "./web.controller";
import json from "koa-json";
import { koaBody } from "koa-body";
import logger from "koa-logger";

// import { addTag, getTagsByCategory } from "./tag.controller";
// import { createNote, getNotesBySourceFile } from "./note.controller";

const debug = Debug();

const router = new Router();

router;
// .get("/api/tag/list", getTagsByCategory)
// .post("/api/tag", addTag)
// .get("/api/note/list", getNotesBySourceFile)
// .post("/api/note", createNote)
// .put("/api/note", updateNote)
// .post("/api/webpage", addWebpage);

export default function initAPI() {
  debug("registed router: \n%O", router.stack);
  new Koa()
    .use(async (ctx: Context, next: Next) => {
      debug(ctx.request.body);
      try {
        await next();
      } catch (err: any) {
        debug("catch error:", err);
        err.status = err.statusCode || err.status || 500;
        ctx.body = {
          code: -1,
          message: err.message,
        };
        ctx.app.emit("error", err, ctx);
      }
    })
    .use(logger())
    .use(json({ pretty: false, param: "pretty", spaces: 2 }))
    .use(
      koaBody({
        multipart: true,
        formidable: {
          uploadDir: dbDirs.upload(),
          keepExtensions: true,
          multiples: true,
        },
      })
    )
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(4189)
    .on("error", (err: Error, ctx: Context) => {
      debug("server error:", err, ctx);
      ctx.status = 500;
    });
}
