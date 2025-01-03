import { Pipe } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { Observable } from 'rxjs';

@Pipe({
  name: 'formateDate',
})
export class FormateDatePipe {
  constructor() {}

  transform(date: any, ft: string) {
    return new Observable<string>(observer => {
      if (!date) {
        observer.next(null);
        observer.complete();
      } else {
        let fd = null;
        if (date instanceof Date) {
          fd = format(date, ft);
        } else {
          fd = format(parseISO(date), ft);
        }

        observer.next(fd);
        observer.complete();
      }
    });
  }
}