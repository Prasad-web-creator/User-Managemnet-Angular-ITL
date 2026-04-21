import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DataService, User } from '../../../services/data.service';


@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './edit-user-dialog.html',
  styleUrl: './edit-user-dialog.scss'
})
export class EditUserDialogComponent implements OnInit {
  editForm!: FormGroup;
  roles: string[] = [];
  departments: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {}

  ngOnInit(): void {
    this.roles = this.dataService.ROLES;
    this.departments = this.dataService.DEPARTMENTS;

    this.editForm = this.fb.group({
      fullName: [this.data.fullName || '', [Validators.required, Validators.minLength(3), DataService.nameValidator]],
      email: [this.data.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.data.phoneNumber || '', [Validators.required, Validators.pattern(this.dataService.PATTERNS.PHONE)]],
      role: [this.data.role || '', Validators.required],
      department: [this.data.department || '', Validators.required],
      status: [this.data.status || 'Active', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.value);
    } else {
      Object.keys(this.editForm.controls).forEach(key => {
        const control = this.editForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
