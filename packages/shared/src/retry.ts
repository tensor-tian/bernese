import Debug from "./debug";

const localDebug = Debug();

function retryIfFail<Args extends any[], R extends any>(
  tryDo: (...args: Args) => Promise<R>,
  options: {
    timeout?: number;
    interval?: number;
    debug?: typeof localDebug;
    maxTry?: number;
  }
): (...args: Args) => Promise<Exclude<R, null | undefined>> {
  const { timeout, interval, debug, maxTry } = {
    timeout: 500,
    interval: 10,
    maxTry: 50,
    debug: localDebug,
    ...options,
  };
  async function fn(...args: Args) {
    const start = Date.now();
    const timeoutAt = start + timeout;
    let ret = await tryDo(...args).catch(debug);
    let tryCount = 1;
    while (ret === null || ret === undefined) {
      if (tryCount > maxTry) {
        return Promise.reject("try too many times");
      }
      if (Date.now() > timeoutAt) {
        return Promise.reject("timeout");
      }
      await new Promise((res) => setTimeout(res, interval));
      ret = await tryDo(...args).catch(debug);
      tryCount++;
    }
    return ret as Exclude<R, null | undefined>;
  }
  return fn;
}

export default retryIfFail;
