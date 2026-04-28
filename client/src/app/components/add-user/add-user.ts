// src/app/add-user/add-user.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

  isEditMode = false;
  isOwnProfile = false;
  editUserId: string | null = null;
  initialFormState: any = null;
  initialImagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder, 
    private dataService: DataService, 
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles.map(r => r.name);
      },
      error: () => {} // Handled by global interceptor
    });
    this.departments = this.dataService.getDepartments();
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
      joiningDate: ['', [Validators.required, DataService.joiningDateValidator]],
      address: ['', Validators.maxLength(200)],
      profileImage: [null]
    }, { validators: DataService.passwordMatchValidator });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editUserId = id;
        
        const currentUserStr = localStorage.getItem('user');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser._id === id) {
            this.isOwnProfile = true;
          }
        }
        
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.clearValidators();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();
        
        this.dataService.getUser(id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              const u = res.data;
              let jDate = '';
              if (u.joiningDate) {
                 jDate = u.joiningDate.includes('T') ? u.joiningDate.split('T')[0] : u.joiningDate;
              }
              this.userForm.patchValue({
                fullName: u.fullName,
                email: u.email,
                phoneNumber: u.phoneNumber,
                username: u.username,
                role: u.role,
                department: u.department,
                status: u.status || 'Active',
                joiningDate: jDate,
                address: u.address || ''
              });
              if (u.profileImage) {
                 this.imagePreview = u.profileImage;
              }
              
              this.initialFormState = this.userForm.value;
              this.initialImagePreview = this.imagePreview;
            }
          }
        });
      }
    });
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
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
      this.userForm.patchValue({ profileImage: file });
    }
  }

  cancelEdit(): void {
    this.router.navigate(['/users']);
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };
      delete formData.confirmPassword;
      
      const backendPayload = {
        ...formData,
        profileImage: this.imagePreview ? this.imagePreview : null
      };

      if (this.isEditMode && this.editUserId) {
        const currentFormState = this.userForm.value;
        const formChanged = JSON.stringify(this.initialFormState) !== JSON.stringify(currentFormState);
        const imageChanged = this.initialImagePreview !== this.imagePreview;

        if (!formChanged && !imageChanged) {
          this.dataService.showNotification('No changes made', 'info');
          return;
        }

        this.dataService.updateUser(this.editUserId, backendPayload).subscribe({
          next: (response) => {
            if (response.success) {
              const currentUserStr = localStorage.getItem('user');
              if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser._id === this.editUserId) {
                   localStorage.setItem('user', JSON.stringify({...currentUser, ...response.data}));
                }
              }
              this.router.navigate(['/users']);
            }
          },
          error: () => {} // Handled by global interceptor
        });
      } else {
        this.dataService.addUser(backendPayload).subscribe({
          next: (response) => {
            if (response.success) {
              this.router.navigate(['/users']);
            }
          },
          error: () => {} // Handled by global interceptor
        });
      }
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