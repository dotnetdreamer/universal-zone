import { first } from 'rxjs/operators';

import { EVENT_NAME, MessageBus } from './message-bus';
import { createMessage, Message, props } from './models';

const createTestMessage = createMessage('test-message', props<{ value: number }>());

describe('Message bus', () => {
  let bus: MessageBus;
  const testMessage = createTestMessage({ value: 1 });

  beforeEach(() => {
    bus = new MessageBus();
    bus.startListening();
  });

  afterEach(() => {
    bus.stopListening();
  });

  it('sends native browser event', (done) => {
    const handler = (e: CustomEvent<Message>) => {
      expect(e.detail).toBe(testMessage);
      document.removeEventListener(EVENT_NAME, handler);
      done();
    };

    document.addEventListener(EVENT_NAME, handler);

    bus.dispatch(testMessage);
  });

  it('receives native browser event', (done) => {
    bus.event$.pipe(first()).subscribe((e) => {
      expect(e).toBe(testMessage);
      done();
    });

    sendNativeMessage(testMessage);
  });

  it('can send messages between messagebusses', (done) => {
    bus.event$.pipe(first()).subscribe((data) => {
      expect(data).toBe(testMessage);
      done();
    });

    const secondaryBus = new MessageBus();
    secondaryBus.dispatch(testMessage);
  });

  it('can start listening to events', (done) => {
    bus = new MessageBus();
    bus.event$.subscribe(() => {
      done();
    });

    bus.startListening();
    sendNativeMessage(testMessage);
  });
});

const sendNativeMessage = (message: Message) => {
  document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: message }));
};
