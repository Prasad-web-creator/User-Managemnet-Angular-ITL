import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Role } from '../../../services/data.service';

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './role-dialog.html',
  styleUrl: './role-dialog.scss'
})
export class RoleDialogComponent implements OnInit {
  roleForm: FormGroup;
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Role | null
  ) {
    this.isEdit = !!data;
    this.roleForm = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || ''],
      permissions: this.fb.group({
        dashboard: [this.data?.permissions?.dashboard || false],
        viewUsers: [this.data?.permissions?.viewUsers || false],
        editUsers: [this.data?.permissions?.editUsers || false],
        deleteUsers: [this.data?.permissions?.deleteUsers || false],
        roles: [this.data?.permissions?.roles || false],
        addUser: [this.data?.permissions?.addUser || false],
        viewActivityLog: [this.data?.permissions?.viewActivityLog || false],
        teams: [this.data?.permissions?.teams || false],
        projects: [this.data?.permissions?.projects || false]
      })
    });
  }

  ngOnInit(): void {
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      this.dialogRef.close(this.roleForm.value);
    }
  }
}
