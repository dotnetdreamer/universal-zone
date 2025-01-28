import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { IonButton, IonIcon, IonAccordionGroup, IonAccordion } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { helpCircleOutline, closeCircleOutline, informationCircleOutline } from "ionicons/icons";

@Component({
    selector: 'help-icon',
    template: `
        <ion-button class="help-button button-no-border" fill="clear" (click)="onHelpClicked()">
            <ion-icon ios="help-circle-outline" md="help-circle-outline" *ngIf="!accordionGroup.value"></ion-icon>
            <ion-icon ios="close-circle-outline" md="close-circle-outline" *ngIf="accordionGroup.value"></ion-icon>
        </ion-button>
        <ion-accordion-group #accordionGroup>
            <ion-accordion value="first">
                <div slot="content" class="help-content">
                    <span>
                        <ion-icon ios="information-circle-outline" md="information-circle-outline"></ion-icon>
                        <!-- <strong>{{'admin.common.alert' | localizedResource | async}}:</strong> -->
                    </span>
                    <p [innerHTML]="text"></p>
                </div>
            </ion-accordion>
        </ion-accordion-group>
    `,
    styles: [`
        :host {
            display: inline-block;
            width: 100%;

            --help-icon-right: 10px;
            --help-icon-left: initial;
            --help-icon-caret-left: 35px;
            --help-icon-caret-right: initial;
            --help-icon-content-margin-left: 24px;
            --help-icon-content-margin-right: initial;
        }

        .help-button {
            position: absolute;
            right: var(--help-icon-right);
            left: var(--help-icon-left);
            top: 0;
            z-index: 9999;
            height: 36px;
        }
        
        .help-content {
            position: relative;
            margin-top: 10px;
            background: var(--ion-color-primary);
            color: #fff;
            padding: 10px;
        }

        .help-content::after {
            content: "";
            position: absolute;
            width: 0;
            height: 0;
            border-width: 10px;
            border-style: solid;
            border-color: transparent transparent var(--ion-color-primary) transparent;
            top: -19px;
            left: var(--help-icon-caret-left);
            right: var(--help-icon-caret-right);
        }

        .help-content span {
            display: flex;
            align-items: center;
        }

        .help-content span ion-icon {
            font-size: 24px;
        }

        .help-content p {
            margin-left: var(--help-icon-content-margin-left);
            margin-right: var(--help-icon-content-margin-right);
        }
    `],
    standalone: true,
    imports: [CommonModule, IonButton, IonIcon, IonAccordionGroup, IonAccordion]
})
export class HelpIconComponent implements OnInit {
    @Input() text!: string;
    @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;

    constructor() {
        addIcons({ helpCircleOutline, closeCircleOutline, informationCircleOutline });
    }

    ngOnInit() {
        if (!this.text) {
            this.text = 'Please add some help text';
        }
    }

    onHelpClicked() {
        const nativeEl = this.accordionGroup;
        if (nativeEl.value === 'first') {
            nativeEl.value = undefined;
        } else {
            nativeEl.value = 'first';
        }
    }
}
