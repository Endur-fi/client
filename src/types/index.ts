export interface TokenProps {
  params: {
    token: string;
  };
}

// SOLVED: moved utility Result types from utils.ts
export type Success<T> = {
  data: T;
  error: null;
};

export type Failure<E> = {
  data: null;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;
