import { BNote, BWebpage } from "@/data";

import BBase from "@/data/schema/entity/base";
import type { FSWatcher } from "fs";
import Path from "path";
import _ from "lodash";
import { dbDirs } from "@/config";
import debounceByKey from "@bernese/shared/src/debounce-by-key";
import fs from "fs";
import fsPromise from "fs/promises";

// export async function addWatch<T extends BBase>(entity: Editable<T> & BBase) {}

type EditableEntity = BNote | BWebpage;
type EditableEntityType = typeof BNote | typeof BWebpage;

const BR = "------";

export async function startEditingFile(entity: EditableEntity) {
  const filePath = Path.join(dbDirs.editing(), entity.$id);
  await fsPromise.writeFile(
    filePath,
    `## ${entity.title}\n\n${BR}\n${entity.content}`
  );
  return filePath;
}

async function afterFileUpdate<E extends EditableEntityType>(
  EntityType: E,
  id: number
) {
  // @ts-ignore
  const entity = await EntityType.findOneBy({ id });
  if (!entity) return;

  const filePath = Path.join(dbDirs.editing(), entity.$id);
  const text = await fsPromise.readFile(filePath, { encoding: "utf8" });
  const titleIdx = text.indexOf(" ");
  const brIdx = text.indexOf(BR);
  if (brIdx === -1 || titleIdx === -1 || titleIdx > brIdx) return;
  entity.title = text.slice(titleIdx, brIdx).trim();
  entity.content = text.slice(brIdx + BR.length).trim();
  // @ts-ignore
  await EntityType.save(entity);

  const st = await fsPromise.stat(filePath);
  if (st.mtimeMs < Date.now() - 24 * 3600 * 1000) {
    await fsPromise.rm(filePath, { force: true });
  }
}

export async function startWatchEditingFiles(dir: string): Promise<FSWatcher> {
  const files = await fsPromise.readdir(dir, {
    encoding: "utf8",
    withFileTypes: false,
  });

  const debouncedFileContentUpdate = debounceByKey(afterFileUpdate, 5000);
  function update(filename: string) {
    const { schema, id } = BBase.parse$id(
      filename.slice(0, filename.length - 3)
    );
    if (!schema) return;
    switch (schema) {
      case BNote.name: {
        debouncedFileContentUpdate(id!.toString(), BNote, id!);
        break;
      }
      case BWebpage.name: {
        debouncedFileContentUpdate(id!.toString(), BNote, id!);
        break;
      }
    }
  }
  for (const filename of files) {
    if (!filename.endsWith(".md")) continue;
    const filePath = Path.join(dir, filename);
    update(filename);
  }
  return fs.watch(
    dir,
    { persistent: true, recursive: false, encoding: "utf8" },
    async (event, filename) => {
      if (event !== "change") return;
      update(filename);
    }
  );
}
