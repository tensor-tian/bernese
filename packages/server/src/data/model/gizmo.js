import { query, queryfnToString } from "./cayley";

import { GGraph } from "@bernese/shared/src/gizmo";

/**
 * @type GGraph
 */
var g;

/**
 *
 * @param {string} id - parent id
 */
function _firstChild(id) {
  g.V(id)
    .labelContext("tree")
    .out(null, "p")
    .hasR("next", "b:DUMMY")
    .limit(1)
    .all();
}
/**
 *
 * @param {string} id
 * @returns {Promise<{ id:string; p: string; }>}
 */
export function getFirstChild(id) {
  return query(queryfnToString(_firstChild)(id), { first: true });
}
/**
 *  @param {string} id - parent id
 */
function _lastChild(id) {
  g.V(id)
    .labelContext("tree")
    .out(null, "p")
    .has("next", "b:DUMMY")
    .limit(1)
    .all();
}

/**
 *
 * @param {string} id
 * @returns {Promise<{ id:string; p: string; }>}
 */
export function getLastChild(id) {
  return query(queryfnToString(_lastChild)(id), { first: true });
}

/**
 *
 * @param {string} id
 */
function _prevAndNext(id) {
  g.V(id).labelContext("tree").save("next", "prev").saveR("next", "next").all();
}
/**
 * @param {string} id
 * @returns { Promise<{id: string; next: string; prev: string;}>}
 */
export function getPrevAndNext(id) {
  return query(queryfnToString(_prevAndNext)(id), { first: true });
}

/**
 * @param {string} id
 */
function _allSiblings(id) {
  var prevList = g
    .V(id)
    .labelContext("tree")
    .followRecursive(g.M().in("next").except(g.M().is("b:DUMMY")))
    .tagArray();
  for (var i = prevList.length - 1; i >= 0; i--) {
    g.emit(prevList[i]);
  }
  g.emit({ id: id });
  var nextList = g
    .V(id)
    .labelContext("tree")
    .followRecursive(g.M().out("next").except(g.M().is("b:DUMMY")))
    .tagArray();
  for (var i = 0; i < nextList.length; i++) {
    g.emit(nextList[i]);
  }
}
/**
 *
 * @param {string} id : block id
 * @returns {Promise<{ id: string; }[]>}
 */
export function getAllSiblings(id) {
  return query(queryfnToString(_allSiblings)(id));
}

/**
 *
 * @param {string} id
 */
function _children(id) {
  var headId;
  g.V(id)
    .labelContext("tree")
    .out(null, "p")
    .hasR("next", "b:DUMMY")
    .forEach(function (n) {
      headId = n.id;
    });
  if (!headId) return;
  /**
   * @type Record<string, any>
   */
  var map = {};
  g.V(id)
    .labelContext("tree")
    .out(null, "p")
    .forEach(function (n) {
      if (n["p"] !== "next") {
        map[n.id] = n;
      }
    });
  g.emit(map[headId]);
  g.V(headId)
    .labelContext("tree")
    .followRecursive(g.M().out("next").except(g.M().is("b:DUMMY")))
    .forEach(function (n) {
      g.emit(map[n.id]);
    });
}

/**
 *
 * @param {string} parentId
 * @returns
 */
export function getChildren(parentId) {
  return query(queryfnToString(_children)(parentId));
}

/**
 *
 * @param {string} id
 */
function _parent(id) {
  var predicate;
  g.V(id)
    .labelContext("tree")
    .inPredicates()
    .toArray()
    .forEach(function (n) {
      if (n !== "next") {
        predicate = n;
      }
    });
  if (!predicate) return;
  g.V(id).labelContext("tree").in(predicate, "p").all();
}

/**
 *
 * @param {string} id
 * @returns {Promise<{id: string; p: string;}>}
 */
export function getParent(id) {
  return query(queryfnToString(_parent)(id), { first: true });
}

/**
 *
 * @param {string} parentId
 * @param {string} id
 */
function _predicate(parentId, id) {
  g.V(parentId).labelContext("tree").out(null, "p").is(id).limit(1).all();
}

/**
 *
 * @param {string} parentId
 * @param {string} id
 * @returns { Promise<{p: string}> }
 */
export function getPredicate(parentId, id) {
  return query(queryfnToString(_predicate)(parentId, id), { first: true });
}
