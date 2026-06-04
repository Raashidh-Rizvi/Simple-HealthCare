import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard';
import { AppointmentBookingComponent } from './components/appointment-booking/appointment-booking';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { ReceptionDashboardComponent } from './components/reception-dashboard/reception-dashboard';
import { NurseDashboardComponent } from './components/nurse-dashboard/nurse-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'doctor', component: DoctorDashboardComponent },
  { path: 'patient', component: PatientDashboardComponent },
  { path: 'patient/book', component: AppointmentBookingComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'reception', component: ReceptionDashboardComponent },
  { path: 'nurse', component: NurseDashboardComponent },
  { path: '**', redirectTo: '/login' }
];
