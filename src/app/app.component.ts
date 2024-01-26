import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Task } from './task/task';
import { TaskComponent } from "./task/task.component";
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, runTransaction, setDoc, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

const kanbanNames = {
  todo: 'todo',
  inProgress: 'inProgress',
  done: 'done',
}

const getObservable = (collection: CollectionReference<DocumentData>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collectionData(collection, { idField: 'id' })
    .subscribe((v) => {
      subject.next(v as Task[]);
    });
  return subject;
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <mat-toolbar color="primary">
      <mat-icon>local_fire_department</mat-icon>
      <span>Kanban Fire</span>
    </mat-toolbar>
    <div class="content-wrapper">
      <button (click)="newTask()" mat-button><mat-icon>add</mat-icon> Add Task</button>
      <div class="container-wrapper">
        <div class="container">
          <h2>Backlog</h2>

          <mat-card
            cdkDropList
            id="todo"
            #todoList="cdkDropList"
            [cdkDropListData]="(todo$ | async)"
            [cdkDropListConnectedTo]="[doneList, inProgressList]"
            (cdkDropListDropped)="drop($any($event))"
            class="list"
          >
          @if ((todo$ | async)?.length === 0) {
            <p class="empty-label">Empty list</p>
          } @else {
            @for (task of (todo$ | async); track task) {
              <app-task [task]="task" cdkDrag (edit)="editTask('todo',$event)" />
            }
          }
          </mat-card>
        </div>

        <div class="container">
          <h2>In progress</h2>

          <mat-card
            cdkDropList
            id="inProgress"
            #inProgressList="cdkDropList"
            [cdkDropListData]="(inProgress$ | async)"
            [cdkDropListConnectedTo]="[todoList, doneList]"
            (cdkDropListDropped)="drop($any($event))"
            class="list"
          >
          @if ((inProgress$ | async)?.length === 0) {
            <p class="empty-label">Empty list</p>
          } @else {
            @for (task of (inProgress$ | async); track task) {
              <app-task [task]="task" cdkDrag (edit)="editTask('inProgress',$event)" />
            }
          }
          </mat-card>
        </div>

        <div class="container">
          <h2>Done</h2>

          <mat-card
            cdkDropList
            id="done"
            #doneList="cdkDropList"
            [cdkDropListData]="done$ | async"
            [cdkDropListConnectedTo]="[todoList, inProgressList]"
            (cdkDropListDropped)="drop($any($event))"
            class="list"
          >
          @if ((done$ | async)?.length === 0) {
            <p class="empty-label">Empty list</p>
          } @else {
            @for (task of done$ | async; track task) {
              <app-task [task]="task" cdkDrag (edit)="editTask('done',$event)" />
            }
          }
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: `
    mat-toolbar {
      margin-bottom: 20px;

      &>span {
        margin-left: 10px;
      }
    }

    .content-wrapper {
      max-width: 1400px;
    }

    .container-wrapper {
      display: flex;
      justify-content: space-around;
    }

    .container {
      width: 400px;
      margin: 0 25px 25px 0;
    }

    .list {
      border: 1px solid #ccc;
      min-height: 60px;
      border-radius: 4px;
    }

    app-new-task {
      margin-bottom: 30px;
    }

    .empty-label {
      font-size: 2em;
      padding-top: 10px;
      text-align: center;
      opacity: 0.2;
    }

    .cdk-drag {
      &-animating {
        transition: transform 250ms;
      }

      &-placeholder {
        opacity: 0;
      }
    }
    
  `,
  imports: [MatToolbarModule, MatIconModule, TaskComponent, MatCardModule, DragDropModule, MatButtonModule, MatIconModule, MatDialogModule, AsyncPipe]
})
export class AppComponent {
  private dialog = inject(MatDialog);
  private firestore = inject(Firestore);

  todo$ = getObservable(collection(this.firestore, kanbanNames.todo)) as Observable<Task[]>;
  inProgress$ = getObservable(collection(this.firestore, kanbanNames.inProgress)) as Observable<Task[]>;
  done$ = getObservable(collection(this.firestore, kanbanNames.done)) as Observable<Task[]>;

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult | undefined) => {
      if (!result) return;
      const elRef = doc(this.firestore, `${list}/${task.id}`);
      if (result.delete) {
        deleteDoc(elRef);
      } else {
        setDoc(elRef, task);
      }
    });
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {}
      }
    });
    dialogRef.afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) return;
        addDoc(collection(this.firestore, 'todo'), result.task);
      });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) return;
    if (!event.container.data || !event.previousContainer.data) return;
    const item = event.previousContainer.data[event.previousIndex];
    const deleteRef = doc(this.firestore, `${event.previousContainer.id + '/' + item.id}`);
    runTransaction(this.firestore, () => {
      const promise = Promise.all([
        deleteDoc(deleteRef),
        addDoc(collection(this.firestore, event.container.id), item)
      ]);
      return promise;
    })

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    )
  }
}
