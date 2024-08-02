import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyNumber]'
})
export class OnlyNumberDirective {
  constructor() { }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (event.key === '.') {
      event.preventDefault();
    }
  }
}