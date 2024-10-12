import { defer, Observable } from 'rxjs';

import { MessageBus } from './message-bus';
import { Message } from './models';

export function provideTestMessages(getMessages: () => Observable<Message>) {
  return {
    provide: MessageBus,
    useFactory: () => ({
      event$: defer(getMessages),
    }),
  };
}
