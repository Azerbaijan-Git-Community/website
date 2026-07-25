export function ok(): ActionSuccess<undefined>;
export function ok<T>(data: T): ActionSuccess<T>;
export function ok<T>(data?: T): ActionSuccess<T | undefined> {
  return { ok: true, data };
}

export function err(error: unknown): ActionFailure {
  console.error(error);

  let message: string;
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    message = error.message;
  } else {
    message = "Something went wrong on our side.";
  }

  if (message.length > 300) {
    message = message.slice(0, 297) + "...";
  }

  return { ok: false, error: message };
}

type ActionSuccess<T> = { ok: true; data: T };

type ActionFailure = { ok: false; error: string };

type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export type InferActionData<T> = T extends (...args: never[]) => Promise<ActionResult<infer D>> ? D : never;
