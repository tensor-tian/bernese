import { BDir, BFile, BFormat, BNote, BWebpage } from "./schema";
import { FulltextSubscriber, registerSegment } from "@bernese/fulltext/src";
import { ensureDirSync, writeTextFileSync } from "@/utils/fs";

import { DataSource } from "typeorm";
import Debug from "@bernese/shared/src/debug";
import { FSWatcher } from "fs";
import Path from "path";
import { createDatabase } from "typeorm-extension";
import { dbDirs } from "@/config";
import jieba from "nodejieba";
import pm2 from "pm2";
import { promisify } from "util";
import { startWatchEditingFiles } from "./edit";
import yaml from "js-yaml";

export * from "./schema";
export * from "./graph";

const processManager = {
  connect: promisify<boolean>(pm2.connect.bind(pm2)),
  listProc: promisify(pm2.list.bind(pm2)),
  startProc: promisify<pm2.StartOptions, pm2.Proc>(pm2.start.bind(pm2)),
  stopProc: promisify(pm2.stop.bind(pm2)),
  disconnect: promisify(pm2.disconnect.bind(pm2)),
};
const entities = [BDir, BFile, BFormat, BNote, BWebpage];
const subscribers = [FulltextSubscriber];

const debug = Debug();

registerSegment((text: string) => jieba.cutForSearch(text).join(" "));

const prepareCayleyWorkingDir = async () => {
  const dataDir = Path.join(dbDirs.graph(), "data");
  ensureDirSync(dataDir);
  debug("calay dir:", dataDir);
  const config = {
    store: {
      backend: "leveldb",
      address: dataDir,
      read_only: false,
      options: {
        nosync: false,
      },
      query: {
        timeout: "30s",
      },
      load: {
        ignore_duplicates: false,
        ignore_missing: false,
        batch: 10000,
      },
    },
  };
  const content = yaml.dump(config);
  writeTextFileSync(Path.join(dbDirs.graph(), "cayley.yml"), content);
};

const services: Record<"graph", () => pm2.StartOptions> = {
  graph: () => ({
    name: "graph",
    script: "cayley",
    args: ["http", "-c", "./cayley.yml", "--init"],
    autorestart: false,
    cwd: dbDirs.graph(),
  }),
};
interface State {
  running?: boolean;
  schemaDB?: DataSource;
  watcher?: FSWatcher;
}

const _STATE: State = {};

export async function switchUser(username: string) {
  _STATE.running = false;
  try {
    let { schemaDB, watcher } = _STATE;

    // stop watcher
    if (watcher) {
      watcher.close();
    }
    // stop schema db
    if (schemaDB) {
      schemaDB.destroy();
    }
    // stop services
    await processManager.connect(true);
    const procList = await processManager.listProc();
    for (const proc of procList) {
      const { name } = proc;
      if (!name || !(name in services)) {
        continue;
      }
      debug("stop service: %s", name);
      await processManager.stopProc(name);
    }
    // set user
    dbDirs.setUser(username);

    // start services
    await prepareCayleyWorkingDir();
    const graphConfig = services.graph();
    const proc1 = await processManager.startProc(graphConfig);
    debug("start graph serivce:  ", proc1);

    // start schema db
    const schemaOptions = dbDirs.schema(entities, subscribers);
    await createDatabase(schemaOptions);
    schemaDB = new DataSource(schemaOptions.options!);
    await schemaDB.initialize();

    // start watcher
    watcher = await startWatchEditingFiles(dbDirs.editing());

    _STATE.watcher = watcher;
    _STATE.schemaDB = schemaDB;
    _STATE.running = true;
  } catch (err) {
    debug("reset user workspace failed with error: ", err);
    process.exit(1);
  } finally {
    processManager.disconnect();
  }
}

export async function initialize() {
  await switchUser("default");
}
