import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Task } from '../task/task';
import { MatIconModule } from '@angular/material/icon';

export interface TaskDialogData {
  task: Partial<Task>;
  enableDelete: boolean;
}

export interface TaskDialogResult {
  task: Task;
  delete?: boolean;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
  <div mat-dialog-content>
    <mat-form-field>
     <mat-label>Title</mat-label>
     <input matInput type="text" cdkFocusInitial [(ngModel)]="data.task.title">
    </mat-form-field>
    <mat-form-field>
     <mat-label>Description</mat-label>
     <input matInput type="text" cdkFocusInitial [(ngModel)]="data.task.description">
    </mat-form-field>
  </div>
   <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="{ task: data.task }">OK</button>
      <button mat-button (click)="cancel()">Cancel</button>
      @if (data.enableDelete) {       
        <button mat-fab color="primary" aria-label="Delete" [mat-dialog-close]="{ task: data.task, delete: true }"><mat-icon>delete</mat-icon></button>
      }
   </div>
  `,
  styles: ``
})
export class TaskDialogComponent {
  private dialogRef = inject(MatDialogRef<TaskDialogComponent>);
  public data: TaskDialogData = inject(MAT_DIALOG_DATA);
  private backupTask: Partial<Task> = { ...this.data?.task };

  cancel(): void {
    this.data.task.title = this.backupTask.title;
    this.data.task.description = this.backupTask.description;
    this.dialogRef.close(this.data);
  }
}
