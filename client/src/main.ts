import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/root/app.config';
import { AppComponent } from './app/root/app';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
