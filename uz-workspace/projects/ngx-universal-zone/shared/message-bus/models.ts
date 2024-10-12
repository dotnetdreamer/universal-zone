/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */

import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 *  Messaging system is taken from NGRX (Actions) and adapted to fit our needs.
 */

export interface Message {
  type: string;
}

// declare to make it property-renaming safe
export declare interface TypedMessage<T extends string> extends Message {
  readonly type: T;
}

export function props<P extends object>(): Props<P> {
  return { _as: 'props', _p: undefined! };
}

export type FunctionWithParametersType<P extends unknown[], R = void> = (...args: P) => R;

/**
 * A function that returns an object in the shape of the `Action` interface.  Configured using `createAction`.
 */
export type Creator<P extends any[] = any[], R extends object = object> = FunctionWithParametersType<P, R>;

export interface Props<T> {
  _as: 'props';
  _p: T;
}

/**
 * See `Creator`.
 */
export type MessageCreator<T extends string = string, C extends Creator = Creator> = C & TypedMessage<T>;

export const arraysAreNotAllowedMsg = 'arrays are not allowed in action creators';
type ArraysAreNotAllowed = typeof arraysAreNotAllowedMsg;

export const typePropertyIsNotAllowedMsg = 'type property is not allowed in action creators';
type TypePropertyIsNotAllowed = typeof typePropertyIsNotAllowedMsg;

export type NotAllowedCheck<T extends object> = T extends any[]
  ? ArraysAreNotAllowed
  : T extends { type: any }
  ? TypePropertyIsNotAllowed
  : unknown;

export function createMessage<T extends string>(type: T): MessageCreator<T, () => TypedMessage<T>>;
export function createMessage<T extends string, P extends object>(
  type: T,
  config: Props<P> & NotAllowedCheck<P>
): MessageCreator<T, (props: P & NotAllowedCheck<P>) => P & TypedMessage<T>>;
export function createMessage<T extends string, P extends any[], R extends object>(
  type: T,
  creator: Creator<P, R> & NotAllowedCheck<R>
): FunctionWithParametersType<P, R & TypedMessage<T>> & TypedMessage<T>;

export function createMessage<T extends string, C extends Creator>(type: T, config?: { _as: 'props' } | C): MessageCreator<T> {
  if (typeof config === 'function') {
    return defineType(type, (...args: any[]) => ({
      ...config(...args),
      type,
    }));
  }
  const as = config ? config._as : 'empty';
  switch (as) {
    case 'empty':
      return defineType(type, () => ({ type }));
    case 'props':
      return defineType(type, (propz: object) => ({
        ...propz,
        type,
      }));
    default:
      throw new Error('Unexpected config.');
  }
}

function defineType<T extends string>(type: T, creator: Creator): MessageCreator<T> {
  return Object.defineProperty(creator, 'type', {
    value: type,
    writable: false,
  }) as Creator & { type: T }; // Cast added to fix type system.
}

export function ofMessageType<AC extends MessageCreator<string, Creator>[], U extends Message = Message, V = ReturnType<AC[number]>>(
  ...allowedTypes: AC
): OperatorFunction<U, V>;

export function ofMessageType<
  E extends Extract<U, { type: T1 }>,
  AC extends MessageCreator<string, Creator>,
  T1 extends string | AC,
  U extends Message = Message,
  V = T1 extends string ? E : ReturnType<Extract<T1, AC>>
>(t1: T1): OperatorFunction<U, V>;

export function ofMessageType(...allowedTypes: Array<string | MessageCreator<string, Creator>>): OperatorFunction<Message, Message> {
  return filter((action: Message) =>
    allowedTypes.some((typeOrActionCreator) => {
      if (typeof typeOrActionCreator === 'string') {
        // Comparing the string to type
        return typeOrActionCreator === action.type;
      }

      // We are filtering by ActionCreator
      return typeOrActionCreator.type === action.type;
    })
  );
}
