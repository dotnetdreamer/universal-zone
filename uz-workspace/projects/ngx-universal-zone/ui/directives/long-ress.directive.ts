import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { combineLatest, interval, merge, Subscription, timer } from 'rxjs';
import { map, mapTo, repeat, switchMap, takeUntil, tap } from 'rxjs/operators';

@Directive({
  selector: '[longPress]',
  standalone: false,
})
export class LongPressDirective {
  constructor(private elRef: ElementRef) {
    merge(this.longPressCancel, this.longPressFinish).pipe(
      tap(() => {
        const ref = this.elRef.nativeElement as HTMLElement;
        ref.style.transform = 'scale(1)';
      })
    ).subscribe();
  }

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

    const ref = this.elRef.nativeElement as HTMLElement;
    ref.style.transform = 'scale(0.95)';

    this.pressing = true;
    this.longPressStart.emit(event);

    let obs = timer(this._duration).pipe(map(() => event));
    if (this.isContinuous) {
      obs = obs.pipe(
        tap((event: MouseEvent | TouchEvent) => this.longPressFinish.emit(event)),
        switchMap((event) =>
          interval(this.continuousInterval)
          .pipe(
            map(() => event)
          )
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