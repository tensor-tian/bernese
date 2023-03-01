// import { GGraph } from "@bernese/shared/src/gizmo";
// import { fnBodyString } from "./cayley";

// const arrowFn = (g: GGraph) => {
//   g.V().all();
//   g.V("a", "b")
//     .out(null, "p")
//     .filter(/(\\+)/)
//     .forEach(function (item) {
//       g.emit(item["id"]);
//     });
//   g.emit("ok");
// };
// function fn(g: GGraph) {
//   g.V().all();
//   g.V("a", "b")
//     .out(null, "p")
//     .filter(/(\\+)/)
//     .forEach(function (item) {
//       g.emit(item["id"]);
//     });
//   g.emit("ok");
// }
// const anonymousFn = function (g: GGraph) {
//   g.V().all();
//   g.V("a", "b")
//     .out(null, "p")
//     .filter(/(\\+)/)
//     .forEach(function (item) {
//       g.emit(item["id"]);
//     });
//   g.emit("ok");
// };

// const expected = [
//   "g.V().all();",
//   'g.V("a", "b")',
//   '.out(null, "p")',
//   ".filter(" + String(/(\\+)/) + ")",
//   ".forEach(function (item) {",
//   'g.emit(item["id"]);',
//   "});",
//   'g.emit("ok");',
// ];

// test("gen func", () => {
//   fnBodyString(arrowFn)
//     .split("\n")
//     .forEach((row, i, rows) => {
//       expect(rows.length).toBe(expected.length);
//       expect(row.trim()).toBe(expected[i]);
//     });
//   fnBodyString((g: GGraph) => {
//     g.V().all();
//     g.V("a", "b")
//       .out(null, "p")
//       .filter(/(\\+)/)
//       .forEach(function (item) {
//         g.emit(item["id"]);
//       });
//     g.emit("ok");
//   });
//   fnBodyString(fn)
//     .split("\n")
//     .forEach((row, i, rows) => {
//       expect(rows.length).toBe(expected.length);
//       expect(row.trim()).toBe(expected[i]);
//     });
//   fnBodyString(function fn(g: GGraph) {
//     g.V().all();
//     g.V("a", "b")
//       .out(null, "p")
//       .filter(/(\\+)/)
//       .forEach(function (item) {
//         g.emit(item["id"]);
//       });
//     g.emit("ok");
//   })
//     .split("\n")
//     .forEach((row, i, rows) => {
//       expect(rows.length).toBe(expected.length);
//       expect(row.trim()).toBe(expected[i]);
//     });
//   fnBodyString(anonymousFn)
//     .split("\n")
//     .forEach((row, i, rows) => {
//       expect(rows.length).toBe(expected.length);
//       expect(row.trim()).toBe(expected[i]);
//     });
//   fnBodyString(function (g: GGraph) {
//     g.V().all();
//     g.V("a", "b")
//       .out(null, "p")
//       .filter(/(\\+)/)
//       .forEach(function (item) {
//         g.emit(item["id"]);
//       });
//     g.emit("ok");
//   })
//     .split("\n")
//     .forEach((row, i, rows) => {
//       expect(rows.length).toBe(expected.length);
//       expect(row.trim()).toBe(expected[i]);
//     });
//   expect(fnBodyString((g: GGraph) => g.V().all())).toBe("g.V().all()");
// });
