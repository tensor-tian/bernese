// debounce: invoke func after {delay} ms latter since the last call, group by key
function debounceByKey<TFunc extends (this: any, ...args: any[]) => void>(
  func: TFunc,
  delay: number
): (key: string, ...args: Parameters<TFunc>) => void {
  const map = new Map<string, NodeJS.Timeout>();
  return function debounced(this: any, key: string, ...args: any[]) {
    const context = this;
    const timerId = map.get(key);
    if (timerId) clearTimeout(timerId);
    map.set(
      key,
      setTimeout(function () {
        func.apply(context, args);
        map.delete(key);
      }, delay)
    );
  } as TFunc;
}

export default debounceByKey;
