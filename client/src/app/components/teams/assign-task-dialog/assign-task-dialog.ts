import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataService, Team, User } from '../../../services/data.service';

@Component({
  selector: 'app-assign-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './assign-task-dialog.html',
  styleUrl: './assign-task-dialog.scss'
})
export class AssignTaskDialogComponent implements OnInit {
  taskForm: FormGroup;
  team: Team;
  teamMembers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Team
  ) {
    this.team = data;
    this.taskForm = this.fb.group({
      tasks: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Collect all members including leader, avoiding duplicates
    const userMap = new Map<string, User>();
    
    const addUserToMap = (user: User | string) => {
      if (user && typeof user !== 'string' && user._id) {
        userMap.set(user._id, user);
      }
    };

    if (this.team.leader) {
      addUserToMap(this.team.leader);
    }
    
    if (this.team.members && this.team.members.length > 0) {
      this.team.members.forEach(m => addUserToMap(m));
    }

    this.teamMembers = Array.from(userMap.values());

    const tasksArray = this.taskForm.get('tasks') as FormArray;
    
    // Create form controls for each user
    this.teamMembers.forEach(user => {
      // Find existing task if any
      const existingTask = this.team.tasks?.find(t => {
        const tUserId = typeof t.user === 'string' ? t.user : t.user?._id;
        return tUserId === user._id;
      });

      tasksArray.push(this.fb.group({
        user: [user._id],
        taskName: [existingTask?.taskName || '']
      }));
    });
  }

  get tasksControls() {
    return (this.taskForm.get('tasks') as FormArray).controls;
  }

  isLeader(user: User): boolean {
    if (!user || !user._id || !this.team.leader) return false;
    const leaderId = typeof this.team.leader === 'string' ? this.team.leader : this.team.leader._id;
    return user._id === leaderId;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.dialogRef.close(this.taskForm.value.tasks);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
