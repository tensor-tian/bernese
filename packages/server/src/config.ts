import { DatabaseCreateContext } from "typeorm-extension";
import Path from "path";

const HOME = process.env["HOME"] as string;
const BERNESE_ROOT = Path.join(HOME, ".bernese");

export const dirs = {
  home: HOME,
  bernese: BERNESE_ROOT,
  db: Path.join(BERNESE_ROOT, "db"),
  md: Path.join(BERNESE_ROOT, "bernese-md"),
  users: Path.join(BERNESE_ROOT, "users"),
};

export const baseURL = {
  graph: "http://127.0.0.1:64210/api/v2",
  fulltext: "http://127.0.0.1:64211",
};

export const bin = {
  python: Path.join(HOME, "miniconda3/bin/python"),
};

export const database = {};

const username = Symbol("username");

export const dbDirs = {
  [username]: "default",
  kv: function () {
    return Path.join(dirs.users, this[username], "kv");
  },
  editing: function () {
    return Path.join(dirs.users, this[username], "editing");
  },
  graph: function () {
    return Path.join(dirs.users, this[username], "graph");
  },
  upload: function () {
    return Path.join(dirs.users, this[username], "upload");
  },
  schema: function (entities: Function[], subscribers: Function[]) {
    const dbOptions: DatabaseCreateContext = {
      ifNotExist: true,
      synchronize: true,
      options: {
        type: "mariadb",
        timezone: "Asia/Shanghai",
        connectorPackage: "mysql2",
        username: "process",
        password: "vtu123456",
        database: `bernese_${this[username]}`,
        logging: true,
        synchronize: true,
        entities,
        subscribers,
        migrations: [],
      },
    };
    return dbOptions;
  },
  setUser: function (ns: string) {
    this[username] = ns;
  },
};
