```n-quads
b:1 feature b:2 tree . 
b:1 example b:3 tree .
b:1 definition b:4 tree .
b:1 api b:5 tree .
b:1 note b:6 tree .
b:1 note b:7 tree .
b:1 tag graph .
b:1 tag regexp .
b:1 tag filter .

b:DUMMY next b:4 tree .
b:4 next b:5 tree .
b:5 next b:6 tree .
b:6 next b:7 tree .
b:7 next b:2 tree .
b:2 next b:3 tree .
b:3 next b:DUMMY tree .

b:4 definition b:8 tree .
b:4 defnition b:9 tree .
b:4 note b:a tree .
b:4 note b:b tree .

b:DUMMY next b:8 tree .
b:8 next b:9 tree .
b:9 next b:a tree .
b:a next b:b tree .
b:b next b:DUMMY tree .


b:2 note b:c tree .
b:2 note b:d tree .
b:2 note b:e tree .
b:2 note b:f tree .

b:DUMMY next b:c tree .
b:c next b:d tree .
b:d next b:e tree .
b:e next b:f tree .
b:f next b:DUMMY tree .

b:e doc b:g tree .
b:DUMMY next b:g tree .
b:g next b:DUMMY tree .

```

```assiiflow
               ┌───┐
               │   │
               ▼   │
               2   │
               │   │
               ▼   │
               3   │
               │   │
               ▼   │
             DUMMY │
       1       4   │
               │   │
               ▼   │
               6   │
               │   │
               ▼   │
               8   │
               │   │
               ▼   │
               7   │
               │   │
               └───┘
```


## first child
```js
g.V("b:1")
  .labelContext("tree")
  .out(null, "p")
  .hasR("next", 'b:DUMMY')
  .limit(1)
  .all()

{
    "result": [
        { "id": "b:4", "p": "definition" }
    ]
}
```

## last child
```js
g.V("b:1")
  .labelContext("tree")
  .out(null, "p")
  .has("next", 'b:DUMMY')
  .limit(1)
  .all()

{
    "result": [
        { "id": "b:3", "p": "example" }
    ]
}
```

## parent

```js
function _parent(id) {
  var predicate;
  g.V(id).labelContext("tree")
    .inPredicates()
    .limit(2)
    .toArray().forEach(function (n) {
    if (n !== "next") {
      predicate = n;
    }
  });
  if (!predicate) return
  g.V(id).labelContext("tree").in(predicate, "p").limit(1).all();
}

_parent("b:3")

{
    "result": [
        { "id": "b:1", "p": "example" }
    ]
}
```

## previous sibling & next sibling

```js
g.V("b:3").labelContext("tree")
  .save("next", "prev")
  .saveR("next", "next")
  .all();

{
    "result": [
        { "id": "b:3", "next": "b:2", "prev": "b:DUMMY" }
    ]
}
```

## all siblings

```js
function _allSiblings(id) {
  var prevList = g.V(id).labelContext("tree")
    .followRecursive(g.M().in("next").except(g.M().is("b:DUMMY")))
    .tagArray()
  for (var i = prevList.length - 1; i >= 0; i--) {
    g.emit(prevList[i]);
  }
  g.emit({ id: id });
  var nextList = g.V(id).labelContext("tree")
    .followRecursive(g.M().out("next").except(g.M().is("b:DUMMY")))
    .tagArray();
  for (var i = 0; i < nextList.length; i++) {
    g.emit(nextList[i]);
  }
}

_allSiblings("b:5")

{
    "result": [
        { "id": "b:4" },
        { "id": "b:5" },
        { "id": "b:6" },
        { "id": "b:7" },
        { "id": "b:2" },
        { "id": "b:3" }
    ]
}
```
## all children, without level

```js
function _children(id) {
  var headId;
  g.V(id)
  .labelContext("tree")
  .out(null, "p")
  .hasR("next", 'b:DUMMY')
  .limit(1)
  .forEach(function (n) {
    headId = n.id;
  })
  if (!headId) return
  var map = {};
  g.V(id).labelContext('tree')
  .out(null, 'p').forEach(function (n) {
    if (n.p !== 'next') {
      map[n.id] = n
    }
  });
  g.emit(map[headId])
  g.V(headId).labelContext("tree")
    .followRecursive(g.M().out("next")
        .except(g.M().is("b:DUMMY"))
    ).forEach(function (n) {
      g.emit(map[n.id])
    })
}

_children("b:4")

{
    "result": [
        { "id": "b:8", "p": "definition" },
        { "id": "b:9", "p": "defnition" },
        { "id": "b:a", "p": "note" },
        { "id": "b:b", "p": "note" }
    ]
}
```

## all children,  level 2

```js
function dfs(id, level) {
  if (level <= 0) return;
  var headId;
  g.V(id)
  .labelContext("tree")
  .out(null, "p")
  .hasR("next", 'b:DUMMY')
  .limit(1)
  .forEach(function (n) {
    headId = n.id;
  })
  if (!headId) return
  var map = {};
  g.V(id).tag("parent")
    .labelContext('tree')
    .out(null, 'p').forEach(function (n) {
      if (n.p !== 'next') {
        map[n.id] = n
      }
    });
  g.emit(map[headId])
  dfs(headId, level - 1)
  var ids = g.V(headId).labelContext("tree")
    .followRecursive(g.M().out("next")
        .except(g.M().is("b:DUMMY"))
    ).toArray()
  for (var i = 0; i < ids.length; i++) {
    g.emit(map[ids[i]])
    dfs(ids[i], level - 1)
  }
}

dfs("b:1", 2)

{
    "result": [
        { "id": "b:4", "p": "definition", "parent": "b:1" },
        { "id": "b:8", "p": "definition", "parent": "b:4" },
        { "id": "b:9", "p": "defnition", "parent": "b:4" },
        { "id": "b:a", "p": "note", "parent": "b:4" },
        { "id": "b:b", "p": "note", "parent": "b:4" },
        { "id": "b:5", "p": "api", "parent": "b:1" },
        { "id": "b:6", "p": "note", "parent": "b:1" },
        { "id": "b:7", "p": "note", "parent": "b:1" },
        { "id": "b:2", "p": "feature", "parent": "b:1" },
        { "id": "b:c", "p": "note", "parent": "b:2" },
        { "id": "b:d", "p": "note", "parent": "b:2" },
        { "id": "b:e", "p": "note", "parent": "b:2" },
        { "id": "b:f", "p": "note", "parent": "b:2" },
        { "id": "b:3", "p": "example", "parent": "b:1" }
    ]
}
```