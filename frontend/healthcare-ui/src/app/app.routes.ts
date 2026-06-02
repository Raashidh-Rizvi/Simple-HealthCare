import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard';
import { AppointmentBookingComponent } from './components/appointment-booking/appointment-booking';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'doctor', component: DoctorDashboardComponent },
  { path: 'patient', component: PatientDashboardComponent },
  { path: 'patient/book', component: AppointmentBookingComponent },
  { path: '**', redirectTo: '/login' }
];
