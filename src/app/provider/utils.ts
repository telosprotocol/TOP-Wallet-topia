import { ethErrors } from 'eth-rpc-errors';
import {
  createIdRemapMiddleware,
  JsonRpcMiddleware,
  PendingJsonRpcResponse,
} from 'json-rpc-engine';

export type Maybe<T> = Partial<T> | null | undefined;

export type ConsoleLike = Pick<
  Console,
  'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'
>;

// Constants

export const EMITTED_NOTIFICATIONS = Object.freeze([
  'eth_subscription', // per eth-json-rpc-filters/subscriptionManager
]);

// Utility functions

/**
 * Gets the default middleware for external providers, consisting of an ID
 * remapping middleware and an error middleware.
 *
 * @param logger - The logger to use in the error middleware.
 * @returns An array of json-rpc-engine middleware functions.
 */
export const getDefaultExternalMiddleware = (logger: ConsoleLike = console) => [
  createIdRemapMiddleware(),
  createErrorMiddleware(logger),
];

/**
 * A `json-rpc-engine` middleware that logs RPC errors and validates the request
 * method.
 *
 * @param log - The logging API to use.
 * @returns A json-rpc-engine middleware function.
 */
function createErrorMiddleware(
  log: ConsoleLike,
): JsonRpcMiddleware<unknown, unknown> {
  return (request, response, next) => {
    // json-rpc-engine will terminate the request when it notices this error
    if (typeof request.method !== 'string' || !request.method) {
      response.error = ethErrors.rpc.invalidRequest({
        message: `The request 'method' must be a non-empty string.`,
        data: request,
      });
    }

    next((done) => {
      const { error } = response;
      if (!error) {
        return done();
      }
      log.error(`MetaMask - RPC Error: ${error.message}`, error);
      return done();
    });
  };
}

// resolve response.result or response, reject errors
export const getRpcPromiseCallback =
  (
    resolve: (value?: any) => void,
    reject: (error?: Error) => void,
    unwrapResult = true,
  ) =>
  (error: Error, response: PendingJsonRpcResponse<unknown>): void => {
    if (error || response.error) {
      reject(error || response.error);
    } else {
      !unwrapResult || Array.isArray(response)
        ? resolve(response)
        : resolve(response.result);
    }
  };

/**
 * Checks whether the given chain ID is valid, meaning if it is non-empty,
 * '0x'-prefixed string.
 *
 * @param chainId - The chain ID to validate.
 * @returns Whether the given chain ID is valid.
 */
export const isValidChainId = (chainId: unknown): chainId is string =>
  Boolean(chainId) && typeof chainId === 'string' && chainId.startsWith('0x');

/**
 * Checks whether the given network version is valid, meaning if it is non-empty
 * string.
 *
 * @param networkVersion - The network version to validate.
 * @returns Whether the given network version is valid.
 */
export const isValidNetworkVersion = (
  networkVersion: unknown,
): networkVersion is string =>
  Boolean(networkVersion) && typeof networkVersion === 'string';

export const NOOP = () => undefined;