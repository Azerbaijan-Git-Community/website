export function ok<T = void>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T };
}

export function err(error: unknown): ActionResult<never> {
  console.error(error);

  let message: string;
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    message = String(error.message);
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
