import { del, write } from "./cayley";
import { genID, getKV } from "./db";
import {
  getAllSiblings,
  getFirstChild,
  getParent,
  getPredicate,
  getPrevAndNext,
} from "./gizmo";

import type { NQuadObj } from "./cayley";
import { addDoc } from "./wukong";
import cutMarkdownForSearch from "./markdown";
import debounceByKey from "@bernese/shared/src/debounce-by-key";

const prepareNQuad = (preset: Pick<NQuadObj, "p" | "l">) => ({
  add: (s: string, o: string) => {
    const { p, l } = preset;
    return write(s, p, o, l);
  },
  rm: (s: string, o: string) => {
    const { p, l } = preset;
    return del(s, p, o, l);
  },
});

const TreeLabel = "tree";

const MAP_KEY = Symbol(TreeLabel);
const _tree = {
  [MAP_KEY]: new Map<string, ReturnType<typeof prepareNQuad>>(),
  firstChild: prepareNQuad({ p: "child:first", l: TreeLabel }),
  next: prepareNQuad({ p: "next", l: TreeLabel }),
  child: prepareNQuad({ p: "child", l: TreeLabel }),
};

const treeHandler: ProxyHandler<typeof _tree> = {
  get(target: any, p: string, _receiver: any) {
    const v = target[p] || target[MAP_KEY].get(p);
    if (v) return v;
    const op = prepareNQuad({ p, l: TreeLabel });
    target.map.set(p);
    return op;
  },
};

export const tree = new Proxy(_tree, treeHandler) as typeof _tree & {
  [key: string]: ReturnType<typeof prepareNQuad>;
};

async function genBlockID() {
  return "b:" + (await genID());
}

function toFulltextId(blockId: string) {
  return parseInt(blockId.slice(2), 36);
}

const DUMMY = "b:DUMMY";

async function writeText(id: string, text: string) {
  // text
  await getKV().put(id, text);
  // fulltext
  await addDoc(toFulltextId(id), cutMarkdownForSearch(text));
}

export async function addBlockAfter(
  prevId: string,
  text: string,
  predicate: string = "child"
) {
  const id = await genBlockID();
  const siblingIds = await getAllSiblings(id);
  const prevIdx = siblingIds.findIndex((s) => s.id === prevId);
  const prev = siblingIds[prevIdx];
  if (!prev) {
    throw new Error(`previus block is not found`);
  }
  // parent -> child
  const parent = await getParent(prevId);
  if (!parent) {
    throw new Error(`parent block is not found`);
  }
  await tree[predicate]?.add(parent.id, id);
  // next
  const isTail = prevIdx === siblingIds.length - 1;
  const nextId = isTail ? DUMMY : siblingIds[prevIdx + 1]!.id;
  await tree.next.rm(prevId, nextId);
  await tree.next.add(prevId, id);
  await tree.next.add(id, nextId);
  // text
  await writeText(id, text);
  return id;
}

export async function addChildBlock(
  parentId: string,
  text: string,
  predicate: string = "child"
) {
  const id = await genBlockID();
  const head = await getFirstChild(parentId);
  // child
  await tree[predicate]?.add(parentId, id);
  // next
  if (!head) {
    await tree.next.add(DUMMY, id);
  } else {
    await tree.next.rm(DUMMY, head.id);
    await tree.next.add(DUMMY, id);
    await tree.next.add(id, head.id);
  }
  // text
  await writeText(id, text);
  return id;
}

export async function updateBlockPredicate(
  parentId: string,
  predicate: string,
  id: string
) {
  const { p } = await getPredicate(parentId, id);
  if (p === predicate) return;
  await tree[p]!.rm(parentId, id);
  await tree[predicate]!.add(parentId, id);
}

export async function moveAsFirstChild(id: string, nParentId: string) {
  const { id: oParentId, p } = await getParent(id);
  // child
  if (oParentId !== nParentId) {
    await tree[p]!.rm(oParentId, id);
    await tree[p]!.add(nParentId, id);
  }
  const { prev: oPrevId, next: oNextId } = await getPrevAndNext(id);
  if (oPrevId === DUMMY && nParentId === oParentId) {
    return;
  }
  // remove id
  await tree.next.rm(oPrevId, id);
  await tree.next.rm(id, oNextId);
  await tree.next.add(oPrevId, oNextId);
  // insert id at 0
  const { id: headId } = await getFirstChild(nParentId);
  await tree.next.rm(DUMMY, headId);
  await tree.next.add(DUMMY, id);
  await tree.next.add(id, headId);
}

export async function moveAfter(id: string, nPrevId: string) {
  const { id: oParentId, p } = await getParent(id);
  const { id: nParentId } = await getParent(nPrevId);
  if (oParentId !== nParentId) {
    await tree[p]!.rm(oParentId, id);
    await tree[p]!.add(nParentId, id);
  }
  // remove id
  const { prev: oPrevId, next: oNextId } = await getPrevAndNext(id);
  if (oPrevId === nPrevId) {
    return;
  }
  // remove id
  await tree.next.rm(oPrevId, id);
  await tree.next.rm(id, oNextId);
  await tree.next.add(oPrevId, oNextId);
  // insert after nPrevId
  const { next: nNextId } = await getPrevAndNext(id);
  await tree.next.rm(nPrevId, nNextId);
  await tree.next.add(nPrevId, id);
  await tree.next.add(id, nNextId);
}

const debouncedWriteText = debounceByKey(writeText, 10 * 1000);

export async function updateBlockText(id: string, text: string) {
  debouncedWriteText(id, id, text);
}
