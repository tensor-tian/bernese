export interface Response<T> {
  code: number;
  data: T;
  msg?: string;
}

export type Optional<
  T extends Record<string, any>,
  K extends keyof T
> = Partial<Pick<T, K>>;

export type PickOptional<
  T extends Record<string, any>,
  P extends keyof T,
  O extends keyof T
> = Pick<T, P> & Optional<T, O>;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
