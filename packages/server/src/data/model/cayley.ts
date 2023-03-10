import { GGraph, GPath, Quad3, Quad4, Quads } from "@bernese/shared/src/gizmo";
import { HTTPClient, HTTPErrorData } from "@bernese/shared/src/http";
import { decode, encode } from "./lang-nquads";

import Debug from "@bernese/shared/src/debug";
import _ from "lodash";
import { argv } from "process";
import { baseURL } from "@/config";
import serializeJavascript from "serialize-javascript";

export type { Quad3, Quad4, Quads, NQuadObj } from "@bernese/shared/src/gizmo";

const debug = Debug();
const http = new HTTPClient(baseURL.graph);

export const PredicateAny = null;

function handleCayleyError<T>(options: {
  ignoreWriteExists?: boolean;
  ignoreDelNotExists?: boolean;
  count?: number;
}) {
  return (err: HTTPErrorData) => {
    if (options.ignoreWriteExists && err.error.endsWith("quad exists")) {
      return Promise.resolve({
        result: `Successfully wrote ${options.count} quads.`,
        count: options.count,
      }) as T;
    }
    if (
      options.ignoreDelNotExists &&
      err.error.endsWith("quad does not exist")
    ) {
      return Promise.resolve({
        result: `Successfully deleted ${options.count} quads.`,
        count: options.count || 1,
      }) as T;
    }
    return Promise.reject(err);
  };
}

type MutationRespData = {
  status: number;
  statusText: string;
  message: string;
};

export async function write(
  subject: string,
  predicate: string,
  object: string,
  label?: string,
  ignoreWriteExists = false
) {
  if (!subject || !predicate || !object) {
    throw new Error("invalid n-quad");
  }
  const nquad = label
    ? ([subject, predicate, object, label] as Quad4)
    : ([subject, predicate, object] as Quad3);
  return writeBatch([nquad], ignoreWriteExists);
}
export async function writeBatch(quads: Quads, ignoreWriteExists = false) {
  const count = quads.length;
  if (count === 0) {
    return {
      count: 0,
      result: "no n-quads",
    };
  }
  const data = (quads as Array<Quad3 | Quad4>)
    .map((quad) => {
      return `${quad.map((word) => "<" + encode(word) + ">").join(" ")} .`;
    })
    .join("\n");

  debug("will write:\n", data);
  return http
    .post<MutationRespData>("write", data, {
      headers: {
        "Content-Type": "application/n-quads",
      },
    })
    .catch(handleCayleyError({ ignoreWriteExists, count }));
}
export async function del(
  subject: string,
  predicate: string,
  object: string,
  label?: string,
  ignoreDelNotExists = false
) {
  if (!subject || !predicate || !object) {
    throw new Error("invalid n-quad");
  }
  const nquad = label
    ? ([subject, predicate, object, label] as Quad4)
    : ([subject, predicate, object] as Quad3);
  return delBatch([nquad], ignoreDelNotExists);
}
export async function delBatch(quads: Quads, ignoreDelNotExists = false) {
  const count = quads.length;
  if (count === 0) {
    return {
      count: 0,
      result: "no n-quads to delete",
    };
  }
  const data = (quads as Array<Quad3 | Quad4>)
    .map((quad) => {
      return `${quad.map((word) => "<" + encode(word) + ">").join(" ")} .`;
    })
    .join("\n");

  debug("will delete:\n", data);
  return http
    .post("delete", data, {
      headers: {
        "Content-Type": "application/n-quads",
      },
    })
    .catch(
      handleCayleyError({
        ignoreDelNotExists,
        count,
      })
    );
}

type QueryResponse = {
  result: any[];
};

type QueryOptions<T> = {
  filter?: (_: any) => boolean;
  mapper?: (_: any) => T;
  first?: boolean;
  unique?: boolean; // default true
};

function handleQueryResult<T>(opts: QueryOptions<T>) {
  return (resp?: QueryResponse): T => {
    const unique = typeof opts.unique === "boolean" ? opts.unique : true;
    debug("query resp:", resp);
    if (opts.first) {
      return Promise.resolve(
        resp && Array.isArray(resp.result) && resp.result.length > 0
          ? resp?.result[0]
          : null
      ) as T;
    }
    if (!resp || !Array.isArray(resp.result)) return [] as T;
    let list = resp!.result;
    if (typeof opts.filter === "function") {
      list = list.filter(opts.filter);
    }
    list = list.map((item) => {
      if (typeof item === "object" && item) {
        Object.keys(item).forEach((key) => {
          if (typeof item[key] === "string") {
            item[key] = decode(item[key]);
          }
        });
      }
      if (opts.mapper) {
        return opts.mapper(item);
      }
      return item;
    });
    if (unique) {
      list = _.uniqWith(list, _.isEqual);
    }
    return list as T;
  };
}

export async function query<T = any>(
  code: string,
  postOpts: QueryOptions<T> = {}
): Promise<T> {
  debug("query:", code);
  return http
    .post<any>("query", code, {
      headers: { "Content-Type": "*/*" },
      params: { lang: "gizmo" },
    })
    .then(handleQueryResult<T>(postOpts))
    .catch(handleCayleyError({}));
}

const pathKeys = {
  chain: [
    "and",
    "as",
    "back",
    "both",
    "count",
    "difference",
    "except",
    "filter",
    "follow",
    "followR",
    "followRecursive",
    "has",
    "hasR",
    "in",
    "inPredicates",
    "intersect",
    "is",
    "labelContext",
    "labels",
    "limit",
    "out",
    "outPredicates",
    "save",
    "saveR",
    "saveOpt",
    "saveInPredicates",
    "saveOutPredicates",
    "skip",
    "tag",
    "union",
    "unique",
    "order",
  ] as const,
  query: ["all", "getLimit", "tagArray"] as const,
  js: [
    "count",
    "forEach",
    "map",
    "tagArray",
    "tagValue",
    "toArray",
    "toValue",
  ] as const,
};
type ItemInSet<S> = S extends Set<infer T> ? T : unknown;
const chainSet = new Set(pathKeys.chain);
const querySet = new Set(pathKeys.query);
const jsSet = new Set(pathKeys.js);

export function argsCode(args: any[]) {
  return args
    .map((arg, i) => {
      switch (typeof arg) {
        case "string":
          return `"${arg}"`;
        case "number":
          return arg;
        case "function":
          const reg =
            /(?:\b[a-zA-Z0-9_$]+[a-zA-Z0-9_$]*\.)(g\.(?:emit|V|Vertex|M|Morphism)\()/g;
          return serializeJavascript(arg).replace(reg, "$1");
        case "object":
          if (arg === null) {
            return "undefined";
          }
          if (arg.isGizmoPath) {
            return genCode(arg.pathObj);
          }
          if (Array.isArray(arg)) {
            return JSON.stringify(arg);
          }
          break;
        case "undefined":
          return "undefined";
      }
      throw new Error(`unknown arg type, args[${i}], ${args} `);
    })
    .join(", ");
}
function genCode(calls: [string, any[]][]): string {
  return calls.reduce((prev, [fn, args]) => {
    prev =
      prev === ""
        ? `${fn}(${argsCode(args)})`
        : `${prev}.${fn}(${argsCode(args)})`;
    return prev;
  }, "");
}

function newPathProxy(graph: Graph, initLine: [string, any[]]): GPath {
  return new Proxy(new Array<[string, any[]]>(initLine), {
    get: function (target: [string, any[]][], propKey: string, receiver) {
      if (propKey === "isGizmoPath") {
        return true;
      }
      if (propKey === "pathObj") {
        return target;
      }
      if (chainSet.has(propKey as ItemInSet<typeof chainSet>)) {
        return (...args: string[]) => {
          target.push([propKey, args]);
          return receiver;
        };
      }
      if (jsSet.has(propKey as ItemInSet<typeof jsSet>)) {
        return (...args: string[]) => {
          target.push([propKey, args]);
          graph.addCode(genCode(target));
          return null;
        };
      }
      if (querySet.has(propKey as ItemInSet<typeof querySet>)) {
        return (...args: string[]) => {
          target.push([propKey, args]);
          graph.addCode(genCode(target));
          return null;
        };
      }
      throw new Error("not defined call");
    },
  }) as unknown as GPath;
}

export class Graph {
  private codes: string[] = [];
  addCode(line: string) {
    this.codes.push(line);
  }
  V(...nodeIds: string[]) {
    return newPathProxy(this, ["g.V", nodeIds]);
  }
  Vertext(...nodeIds: string[]) {
    return newPathProxy(this, ["g.Vertext", nodeIds]);
  }
  M() {
    return newPathProxy(this, ["g.M", []]);
  }
  Morphism() {
    return newPathProxy(this, ["g.Morphism", []]);
  }
  emit(data: any) {
    return `g.emit(${argsCode([data])})`;
  }

  code(): string {
    const code = this.codes.join(`;\n`) + ";";
    this.codes.length = 0;
    return code;
  }
}

// ?????? g, graph ?????? query ??????????????????, ??????????????????
// ?????????, ?????? new Graph ??????
export const g = new Graph() as Graph & GGraph;
export const graph = new Graph() as Graph & GGraph;

const regFnDelac =
  /^\s*(?:(?:\(([^)]+)\)\s*\=>\s*\{)|(?:function\s+[\w0-9a-z]+\s*\(([^)]+)\)\s*\{)|(?:function\s+\(([^)]+)\)\s*\{))((?:.|\n)*)\}/;

export function queryfnToString<TFunction extends (...args: any[]) => void>(
  fn: TFunction
) {
  return function (...args: Parameters<TFunction>): string {
    let fnStr = serializeJavascript(fn).trim();
    const match = fnStr.match(regFnDelac);
    if (!match) {
      throw new Error(`invalid query function: ${fnStr}`);
    }
    let argNamess = (match[1] || match[2] || match[3])!
      .split(",")
      .map((arg) => arg.trim());
    const body = match[4];
    if (args.length !== argNamess.length) {
      debug("invalid query function args: %o, argVals: %O", args, arguments);
      throw new Error(`invalid query function arg`);
    }
    return (
      args
        .map((v, i) => `var ${args[i]} = ${serializeJavascript(v)};`)
        .join("\n") +
      "\n" +
      body
    );
  };
}
