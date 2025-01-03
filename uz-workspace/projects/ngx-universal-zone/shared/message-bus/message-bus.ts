import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Message } from './models';

export const EVENT_NAME = 'uz-message-bus';

@Injectable({ providedIn: 'root' })
export class MessageBus {
  private readonly eventHandler: (customEvent: CustomEvent<Message>) => void;
  private messageSubject = new Subject<Message>();
  event$ = this.messageSubject.asObservable();

  constructor() {
    this.eventHandler = this.handleEvent.bind(this);
  }

  dispatch(message: Message) {
    const event = new CustomEvent(EVENT_NAME, { detail: message });
    document.dispatchEvent(event);
  }

  startListening() {
    document.addEventListener(EVENT_NAME, this.eventHandler);
  }

  stopListening() {
    document.removeEventListener(EVENT_NAME, this.eventHandler);
  }

  private handleEvent(customEvent: CustomEvent<Message>) {
    this.messageSubject.next(customEvent.detail);
  }
}
