// src/app/add-user/add-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss'
})
export class AddUserComponent implements OnInit {
  userForm!: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  selectedImageFile: File | null = null;
  todayDate: string = '';

  roles: string[] = [];
  departments: string[] = [];

  constructor(
    private fb: FormBuilder, 
    private dataService: DataService, 
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roles = this.dataService.ROLES;
    this.departments = this.dataService.DEPARTMENTS;
    this.todayDate = this.dataService.getTodayDate();

    this.userForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), DataService.nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(this.dataService.PATTERNS.PHONE)]], 
      username: ['', [Validators.required, Validators.minLength(4), DataService.noSpacesValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required],
      department: ['', Validators.required],
      status: ['Active', Validators.required],
      joiningDate: ['', [Validators.required, DataService.futureDateValidator]],
      address: ['', Validators.maxLength(200)],
      profileImage: [null]
    }, { validators: DataService.passwordMatchValidator });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select a valid image file (JPEG, PNG, etc.)', 'Close', { 
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return;
      }


      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
      this.userForm.patchValue({ profileImage: file });
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };
      delete formData.confirmPassword;
      
      const backendPayload = {
        ...formData,
        profileImage: this.selectedImageFile ? this.selectedImageFile.name : null
      };

      this.dataService.addUser(backendPayload).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/users']);
          }
        }
      });
    } else {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        control?.markAsTouched();
      });
      this.dataService.showNotification('Please fix validation errors before submitting.', 'error');
    }
  }

  get f() { return this.userForm.controls; }
}