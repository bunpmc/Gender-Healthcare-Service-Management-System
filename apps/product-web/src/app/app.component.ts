import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FloatingActionsComponent } from './components/floating-actions/floating-actions.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FloatingActionsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
