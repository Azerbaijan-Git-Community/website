import { runInContext } from "node:vm";
import { builtinEnvironments, type Environment } from "vitest/runtime";

// Node web APIs that MSW, undici and better-auth expect, but Vitest's VM jsdom context doesn't copy over.
const NODE_GLOBALS = [
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "TextEncoderStream",
  "TextDecoderStream",
  "CompressionStream",
  "DecompressionStream",
] as const;

/** jsdom, created once per worker (`vmThreads`), with the Node globals our tests need. */
export default {
  ...builtinEnvironments.jsdom,
  name: "jsdom-vm",
  async setupVM(options) {
    const vm = await builtinEnvironments.jsdom.setupVM!(options);
    const context = vm.getVmContext();
    for (const name of NODE_GLOBALS) context[name] ??= globalThis[name];
    // jsdom's crypto lacks `subtle`; the default (non-VM) pool exposes Node's Web Crypto too.
    Object.defineProperty(context, "crypto", { value: globalThis.crypto, configurable: true, writable: true });
    // Node's fetch rejects with an outer-realm TypeError that fails `instanceof Error` inside the VM.
    const VmTypeError: TypeErrorConstructor = runInContext("TypeError", context);
    const nodeFetch: typeof fetch = context.fetch;
    context.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
      nodeFetch(input, init).catch((error: unknown) => {
        throw error instanceof TypeError ? new VmTypeError(error.message, { cause: error.cause }) : error;
      });
    return vm;
  },
} satisfies Environment;
