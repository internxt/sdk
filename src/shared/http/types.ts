export type URL = string;
export type Headers = Record<string, string>;
export type Parameters = Record<string, unknown>;

export interface RequestCanceler {
  cancel: (message?: string) => void;
}

export type UnauthorizedCallback = () => void