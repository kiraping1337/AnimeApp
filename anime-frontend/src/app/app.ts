import { Component, HostBinding, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  @HostBinding('style.--mx') mx = 0;
  @HostBinding('style.--my') my = 0;

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;

    this.mx = Math.round(nx * 100) / 100;
    this.my = Math.round(ny * 100) / 100;
  }
}
