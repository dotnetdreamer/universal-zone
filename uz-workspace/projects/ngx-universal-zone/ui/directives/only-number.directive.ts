import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyNumber]',
  standalone: false,
})
export class OnlyNumberDirective {
  constructor() { }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (event.key === '.') {
      event.preventDefault();
    }
  }
}