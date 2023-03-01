import {
  BaseEntity,
  Column,
  ColumnOptions,
  EntitySubscriberInterface,
  EventSubscriber,
  Index,
  InsertEvent,
  UpdateEvent,
} from "typeorm";

export type FulltextSegment = (raw: string) => string;
const _STATE: {
  fields: Map<Function, Map<string, string>>;
  segment?: FulltextSegment;
} = {
  fields: new Map(),
};

export function registerSegment(segment: FulltextSegment) {
  _STATE.segment = segment;
}

const suffix = "_ft";
export function Fulltext(name: string, fields: string[]) {
  return <T extends { new (...args: any[]): {} }>(constructor: T): T => {
    const fulltextMap = fields.reduce((map, raw) => {
      map.set(raw, `${raw}${suffix}`);
      return map;
    }, new Map<string, string>());
    Index(name, [...fulltextMap.values()], { fulltext: true })(constructor);
    _STATE.fields.set(constructor, fulltextMap);
    return constructor;
  };
}

export function FulltextColumn(options: ColumnOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    Column(options)(target, propertyKey.toString());
    const fulltextKey = propertyKey.toString() + suffix;
    if (typeof options === "string") {
    }
    Column(
      typeof options === "object"
        ? { ...options, select: false }
        : { type: options, select: false }
    )(target, fulltextKey);
  };
}

export async function searchFulltext<T extends BaseEntity>(
  Klass: typeof BaseEntity,
  text: string
) {
  const fields = _STATE.fields.get(Klass);
  if (!fields) {
    throw new Error(`no fulltext key found for entity ${Klass.name}`);
  }
  const fulltextColumns = [...fields.values()].join(",");
  return Klass.createQueryBuilder()
    .addSelect(
      `MATCH(${fulltextColumns}) AGAINST ('${text}'  IN BOOLEAN MODE) `,
      "score"
    )
    .where(`MATCH(${fulltextColumns}) AGAINST ('${text}'  IN  BOOLEAN MODE)`)
    .getMany() as Promise<T[]>;
}

export async function searchFulltextWithScore<T extends BaseEntity>(
  Klass: typeof BaseEntity,
  text: string
) {
  const fields = _STATE.fields.get(Klass);
  if (!fields) {
    throw new Error(`no fulltext key found for entity ${Klass.name}`);
  }
  const fulltextColumns = [...fields.values()].join(",");
  const { raw, entities } = await Klass.createQueryBuilder()
    .addSelect(
      `MATCH(${fulltextColumns}) AGAINST ('${text}'  IN BOOLEAN MODE) `,
      "score"
    )
    .where(`MATCH(${fulltextColumns}) AGAINST ('${text}'  IN  BOOLEAN MODE)`)
    .getRawAndEntities();

  // @ts-ignore
  entities.forEach((entity, index) => (entity["score"] = raw[index].score));
  return entities as T[];
}

@EventSubscriber()
export class FulltextSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): void | Promise<any> {
    const fields = _STATE.fields.get(event?.entity?.constructor);
    if (!fields) return;
    if (!_STATE.segment)
      throw new Error(`call registerFulltextHandler(segmentate)`);
    for (const [rawField, fulltextField] of fields.entries()) {
      event.entity[fulltextField] = _STATE.segment(event.entity[rawField]);
    }
  }

  beforeUpdate(event: UpdateEvent<any>): void | Promise<any> {
    if (!event?.entity) return;
    const fields = _STATE.fields.get(event.entity.constructor);
    if (!fields) return;
    if (!_STATE.segment)
      throw new Error(`call registerFulltextHandler(segmentate)`);
    for (const col of event.updatedColumns) {
      const fulltextField = fields.get(col.propertyName);
      if (fulltextField) {
        event.entity[fulltextField] = _STATE.segment(
          event.entity[col.propertyName]
        );
      }
    }
  }
}
