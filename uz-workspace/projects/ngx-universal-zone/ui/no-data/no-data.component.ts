import { Component, input, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-no-data',
  template: `
    <div class="data-empty">
       @if(iconHtml) {
        <div [innerHtml]="iconHtml"></div>
       }
       @if(message()) {
        <p>{{ message() }}</p>
       }
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .data-empty {
        text-align: center;
        padding-top: 20%;
      }

      .data-empty ion-icon {
        color: #efefef;
        font-size: 100px;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class NoDataComponent implements OnInit {
  icon = input<string>();
  message = input<string>();
  
  iconHtml: SafeHtml;
  constructor(private domSanitizer: DomSanitizer) {}

  ngOnInit() {
    this.iconHtml = this.domSanitizer.bypassSecurityTrustHtml(this.icon());
  }
}
