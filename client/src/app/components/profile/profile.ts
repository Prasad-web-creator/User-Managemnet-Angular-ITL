import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faEdit, faEnvelope, faPhone, faBuilding, faUserCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isLoading = true;

  // Icons
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faBuilding = faBuilding;
  faUserCircle = faUserCircle;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataService: DataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Optimistic UI: Try to instantly load the user from local storage
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const localUser = JSON.parse(userJson);
          if (localUser._id === id) {
            this.user = localUser;
            this.isLoading = false;
          }
        }

        // Fetch from backend to ensure fresh data (or if not current user)
        this.dataService.getUser(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.user = res.data;
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  editProfile() {
    if (this.user) {
      this.router.navigate(['/edit-user', this.user._id]);
    }
  }

  goBack() {
    window.history.back();
  }
}
