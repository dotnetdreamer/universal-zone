import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { interval, Subscription, timer } from 'rxjs';
import { mapTo, switchMap, takeUntil, tap } from 'rxjs/operators';

@Directive({
  selector: '[longPress]',
  standalone: false,
})
export class LongPressDirective {
  @Input('longPress')
  set duration(v: number | string) {
    this._duration = v ? Number(v) : 3000;
  }

  @Input('longPressDisabled')
  disabled = false;

  @Input('longPressInterval')
  set _continuousInterval(v: number) {
    this.isContinuous = !!v;
    this.continuousInterval = v;
  }

  private _duration = 3000;
  private isContinuous = false;
  private continuousInterval = 0;

  @Output() longPressStart = new EventEmitter<MouseEvent | TouchEvent>();
  @Output() longPressFinish = new EventEmitter<MouseEvent | TouchEvent>();
  @Output() longPressCancel = new EventEmitter<MouseEvent | TouchEvent>();

  private pressing = false;
  private longPressSubscription?: Subscription;

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPress(event: MouseEvent | TouchEvent) {
    if (this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    this.pressing = true;
    this.longPressStart.emit(event);

    let obs = timer(this._duration).pipe(mapTo(event));

    if (this.isContinuous) {
      obs = obs.pipe(
        tap((event: MouseEvent | TouchEvent) => this.longPressFinish.emit(event)),
        switchMap((event) =>
          interval(this.continuousInterval).pipe(mapTo(event))
        ),
        takeUntil(this.longPressCancel)
      );
    }

    this.longPressSubscription = obs.subscribe((event) => {
      if (this.pressing) {
        this.pressing = this.isContinuous;
        this.longPressFinish.emit(event);
      }
    });
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  onRelease(event: MouseEvent | TouchEvent) {
    this.pressing = false;
    if (this.longPressSubscription) {
      this.longPressSubscription.unsubscribe();
    }
    this.longPressCancel.emit(event);
  }
}