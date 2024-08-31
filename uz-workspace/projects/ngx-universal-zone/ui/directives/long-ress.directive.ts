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
  
    @Output() longPressStart = new EventEmitter<MouseEvent>();
    @Output() longPressFinish = new EventEmitter<MouseEvent>();
    @Output() longPressCancel = new EventEmitter<MouseEvent>();
  
    private pressing = false;
    private longPressSubscription?: Subscription;
  
    @HostListener('mousedown', ['$event'])
    onPress(event: MouseEvent) {
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
          tap((mouseEvent: MouseEvent) => this.longPressFinish.emit(mouseEvent)),
          switchMap((mouseEvent) =>
            interval(this.continuousInterval).pipe(mapTo(mouseEvent))
          ),
          takeUntil(this.longPressCancel)
        );
      }
  
      this.longPressSubscription = obs.subscribe((mouseEvent) => {
        if (this.pressing) {
          this.pressing = this.isContinuous;
          this.longPressFinish.emit(mouseEvent);
        }
      });
    }
  
    @HostListener('mouseup', ['$event'])
    @HostListener('mouseleave', ['$event'])
    onRelease(event: MouseEvent) {
      this.pressing = false;
      if (this.longPressSubscription) {
        this.longPressSubscription.unsubscribe();
      }
      this.longPressCancel.emit(event);
    }
  }
  