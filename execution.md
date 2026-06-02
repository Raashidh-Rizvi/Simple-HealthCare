# Execution Guide

This document contains the commands to run the Simple Healthcare Application components.

## Prerequisites
- **.NET 10 SDK** or later
- **Node.js** & **Angular CLI**
- **Flutter SDK**
- **PostgreSQL** database running

## 1. Starting the Database

Make sure PostgreSQL is running. We will use it for our Entity Framework Core database.
If you need to update the database schema based on EF Core migrations, run the following from the `/backend/Healthcare.API` directory:
```bash
cd backend/Healthcare.API
dotnet ef database update
```

## 2. Running the Backend (.NET Core Web API)

The backend runs on `http://localhost:5000` (or `https://localhost:5001`).

```bash
cd backend/Healthcare.API
dotnet run
```
You can access the Swagger UI documentation at: `http://localhost:5000/swagger`

## 3. Running the Frontend (Angular)

The Angular development server runs on `http://localhost:4200`.

```bash
cd frontend/healthcare-ui
npm install
npm start
```
Alternatively, you can run `ng serve`.

## 4. Running the Mobile App (Flutter)

The Flutter mobile application allows patients to interact with the system. It connects to the local backend API by default.

```bash
cd healthcare_patient_app
flutter pub get
flutter run
```

> **Note:** For Android Emulator, the backend base URL should be configured to `http://10.0.2.2:5207/api` instead of `localhost`.

## 5. Full Startup

To start the entire platform simultaneously, you will need three separate terminal windows:
1. **Terminal 1**: Start the backend API (`dotnet run`).
2. **Terminal 2**: Start the frontend Web UI (`npm start`).
3. **Terminal 3**: Run the Flutter patient mobile app (`flutter run`).
