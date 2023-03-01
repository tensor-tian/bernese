import type { Context } from "koa";
import Debug from "@bernese/shared/src/debug";
import metaMarkdown from "@bernese/shared/src/meta-markdown";
import { ok } from "./util";
import { startEditingFile } from "@/data/edit";

type CodeLocation = {
  path: string;
  startLine: number; // 0 based number
  endLine: number; // 0 based number
};
export const createNote = async (ctx: Context) => {
  const { content } = ctx.request.body as { content: string };
  // const { metadata, markdown } = metaMarkdown.parse<CodeLocation>(content);
  // if (!metadata) {
  //   ctx.throw("no metadata found");
  // }
  // const { path: filePath, startLine, endLine } = metadata;
  // const sourceFile = await BFile.fromPath(filePath);

  // const note = await BNote.fromFile(sourceFile, startLine, endLine);
  // note.content = markdown;
  // await BNote.save(note);

  // const editingFilePath = await startEditingFile(note);
  // ctx.body = ok({
  //   path: editingFilePath,
  // });
};

export async function getNotesBySourceFile(ctx: Context) {
  const { path } = ctx.request.query;
  // const notes = await BNote.createQueryBuilder("note")
  //   .leftJoin("note.sourceFile", "file")
  //   .where({ sourceFile: { path } })
  //   .getMany();
  // for (const note of notes) {
  //   note["path"] = await startEditingFile(note);
  // }
  // ctx.body = ok(notes);
}
