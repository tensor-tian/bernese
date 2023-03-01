import { Level } from "level";
import { dbDirs } from "@/config";

type State = {
  kv: Level<string, any> | null;
  id: number | null;
};

type StateType<K extends keyof State> = Exclude<State[K], null>;

const _STATE: State = {
  kv: null,
  id: null,
};
const ID_KEY = "id_counter";
const ID_RADIX = 36;

export async function restartKV() {
  const kv = _STATE.kv;
  if (kv && (kv.status === "opening" || kv.status === "open")) {
    kv.close();
  }
  _STATE.kv = new Level<string, any>(dbDirs.kv(), {
    valueEncoding: "json",
  });
  _STATE.id = await _STATE.kv.get(ID_KEY);
  if (typeof _STATE.id !== "number") {
    throw new Error("invalid id counter value");
  }
}

const LEVEL_NOT_FOUND = `LEVEL_NOT_FOUND`;

export function getKV() {
  if (_STATE.kv?.status !== "open") {
    throw new Error("kv db is not open");
  }
  return _STATE.kv;
}

export async function genID() {
  _STATE.id = _STATE.id! + 1;
  await getKV().put(ID_KEY, _STATE.id);
  return _STATE.id.toString(ID_RADIX);
}
