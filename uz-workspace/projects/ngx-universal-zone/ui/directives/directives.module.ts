import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OnlyNumberDirective } from './only-number.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [OnlyNumberDirective],

  exports: [OnlyNumberDirective],
})
export class DirectivesModule {}
