import * as Block from "@/data/model/block";

import { Context } from "koa";
import { ok } from "./util";

type AddBlockAfterBody = {
  prevId: string;
  text: string;
  predicate?: string;
};
export async function addBlockAfter(ctx: Context) {
  const { prevId, text, predicate } = ctx.request.body as AddBlockAfterBody;
  const blockId = await Block.addBlockAfter(prevId, text, predicate);
  return ok(blockId);
}

type AddChildBlockBody = {
  parentId: string;
  text: string;
  predicate?: string;
};

export async function addChildBlock(ctx: Context) {
  const { parentId, text, predicate } = ctx.request.body as AddChildBlockBody;
  const blockId = await Block.addChildBlock(parentId, text, predicate);
  return ok(blockId);
}

type UpdateBlockPredicateBody = {
  parentId: string;
  predicate: string;
  id: string;
};

export async function updateBlockPredicate(ctx: Context) {
  const { parentId, predicate, id } = ctx.request
    .body as UpdateBlockPredicateBody;
  await Block.updateBlockPredicate(parentId, predicate, id);
  return ok();
}

type MoveAsFirstChildBody = {
  id: string;
  newParentId: string;
};
export async function moveAsFirstChild(ctx: Context) {
  const { id, newParentId } = ctx.request.body as MoveAsFirstChildBody;
  await Block.moveAsFirstChild(id, newParentId);
  return ok();
}

type MoveAfterBody = {
  id: string;
  newPreviousId: string;
};

export async function moveAfter(ctx: Context) {
  const { id, newPreviousId } = ctx.request.body as MoveAfterBody;
  await Block.moveAfter(id, newPreviousId);
  return ok();
}

type UpdateBlockTextBody = {
  id: string;
  text: string;
};

export async function updateBlockText(ctx: Context) {
  const { id, text } = ctx.request.body as UpdateBlockTextBody;
  await Block.updateBlockText(id, text);
  return ok();
}
