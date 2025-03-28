import { AfterViewInit,AfterViewChecked, Directive } from '@angular/core';
import * as feather from 'feather-icons';

@Directive({
  selector: '[appFeatherIcon]',
  standalone: true
})

export class FeatherIconDirective implements AfterViewInit, AfterViewChecked {

  constructor() { }

  ngAfterViewInit(): void {
    feather.replace();
  }
  ngAfterViewChecked(): void {
    feather.replace();
  }

}
