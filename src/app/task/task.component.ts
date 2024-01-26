import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Task } from './task';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [MatCardModule],
  template: `
  @if (task) {
    <mat-card class="item" (dblclick)="edit.emit(task)">
      <h2>{{ task.title }}</h2>
      <p>{{ task.description }}</p>
    </mat-card>
  }
  `,
  styles: `
    :host {
      display: block;
    }

    .item {
      margin-bottom: 10px;
      cursor: pointer;
    }
  `
})
export class TaskComponent {
  @Input() task: Task | null = null;
  @Output() edit = new EventEmitter<Task>();
}
