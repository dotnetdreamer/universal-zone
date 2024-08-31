import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OnlyNumberDirective } from './only-number.directive';
import { LongPressDirective } from './long-ress.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [OnlyNumberDirective, LongPressDirective],
  exports: [OnlyNumberDirective, LongPressDirective],
})
export class DirectivesModule {}
