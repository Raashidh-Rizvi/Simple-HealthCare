# Execution Guide

This document contains the commands to run the Simple Healthcare Application components.

## Prerequisites
- **.NET 10 SDK** or later
- **Node.js** & **Angular CLI**
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

## 4. Full Startup

To start both applications simultaneously, you will need two separate terminal windows.
1. In Terminal 1, start the backend API.
2. In Terminal 2, start the frontend UI.
