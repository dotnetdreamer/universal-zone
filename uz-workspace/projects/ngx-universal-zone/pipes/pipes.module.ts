import { NgModule } from '@angular/core';

import { SafePipe } from './safe.pipe';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [SafePipe],
  imports: [CommonModule],
  providers: [],
  exports: [SafePipe],
})
export class PipesModule {}
