# ShiftFlow

ShiftFlow is a scheduling and shift management system designed to simplify workforce planning and approval workflows.

The system allows managers to create schedules, define shifts, assign employees, and manage the review and approval process. Employees can confirm or decline assignments, while approvers can review and approve the final schedule.

## Core Concepts

- **Schedule** — a collection of shifts for a specific planning period.
- **Shift** — a work period that requires one or more employees.
- **Assignment** — a relationship between an employee and a shift.

## How to Run locally

1. Clone the repository `git clone git@github.com:qodunpob/shift-flow.git`
2. Start up the API service
    1. `cd api`
    2. Create a `.env` file with the required local database/API configuration, using `.env.example` as reference.
    3. Install dependencies using `npm install`.
    4. Run DB using `docker-compose -f docker-compose.local.yml up -d`.
    5. Run the database migrations using `npm run migration:run`.
    6. Apply seeds if needed using `npm run seed`.
    7. Start API service using `npm start` or `npm run start:dev`.
3. Start the frontend
    1. `cd ../frontend`.
    2. Create a `.env.local` file, using `.env.example` as reference.
    3. Install dependencies using `npm install`.
    4. Start the application using `npm run dev`.
