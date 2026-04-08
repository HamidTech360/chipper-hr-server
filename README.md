# ChipperHR Server

NestJS + PostgreSQL + Prisma backend for the ChipperHR application.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   # Or to push schema without migrations:
   npm run prisma:push
   ```

5. **Start development server:**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/change-password` - Change password (authenticated)
- `POST /auth/reset-password` - Reset employee password (HR only)
- `GET /auth/me` - Get current user profile

### Organizations
- `POST /organizations` - Create organization
- `GET /organizations/:id` - Get organization details (HR only)
- `PUT /organizations/:id` - Update organization (HR only)

### Departments
- `POST /departments` - Create department (HR only)
- `GET /departments` - List all departments
- `PUT /departments/:id` - Update department (HR only)
- `DELETE /departments/:id` - Delete department (HR only)

### Employees
- `POST /employees` - Create employee (HR only)
- `POST /employees/bulk` - Bulk create employees (HR only)
- `GET /employees` - List employees
- `GET /employees/managers` - List all managers
- `GET /employees/:id` - Get employee details
- `PUT /employees/:id` - Update employee (HR only)
- `PUT /employees/:id/status` - Update employee status (HR only)

### Onboarding
- `POST /onboarding/templates` - Create checklist template (HR only)
- `GET /onboarding/templates` - List templates
- `PUT /onboarding/templates/:id` - Update template (HR only)
- `DELETE /onboarding/templates/:id` - Delete template (HR only)
- `GET /onboarding/checklists` - List checklists
- `GET /onboarding/checklists/:id` - Get checklist details
- `PUT /onboarding/checklists/:checklistId/items/:itemId` - Update item status

### Reviews
- `POST /reviews/cycles` - Create review cycle (HR only)
- `GET /reviews/cycles` - List review cycles (HR only)
- `GET /reviews/cycles/:id` - Get cycle details (HR only)
- `PUT /reviews/cycles/:id` - Update cycle (HR only)
- `PUT /reviews/cycles/:id/activate` - Activate cycle (HR only)
- `PUT /reviews/cycles/:id/pause` - Pause cycle (HR only)
- `PUT /reviews/cycles/:id/close` - Close cycle (HR only)
- `GET /reviews/tasks` - Get my review tasks
- `GET /reviews/submissions/:id` - Get submission details
- `PUT /reviews/submissions/:id` - Save draft
- `POST /reviews/submissions/:id/submit` - Submit review

### OKRs
- `POST /okrs/periods` - Create OKR period (HR only)
- `GET /okrs/periods` - List periods
- `PUT /okrs/periods/:id` - Update period (HR only)
- `PUT /okrs/periods/:id/activate` - Activate period (HR only)
- `POST /okrs` - Create OKR
- `GET /okrs` - List OKRs
- `GET /okrs/:id` - Get OKR details
- `PUT /okrs/:id` - Update OKR
- `PUT /okrs/:id/approve` - Approve OKR
- `PUT /okrs/:id/reject` - Reject OKR
- `PUT /okrs/:id/self-score` - Submit self-scores
- `PUT /okrs/:id/manager-review` - Submit manager final scores

### PIPs
- `POST /pips` - Create PIP (Manager/HR only)
- `GET /pips` - List PIPs
- `GET /pips/:id` - Get PIP details
- `PUT /pips/:id/approve` - Approve PIP (HR only)
- `PUT /pips/:id/reject` - Reject PIP (HR only)
- `PUT /pips/:id/items/:itemId/toggle` - Toggle item completion
- `POST /pips/:id/notes` - Add note

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/departments` - Get department breakdown
- `GET /dashboard/activity` - Get recent activity

## Role-Based Access Control

| Role      | Access Level |
|-----------|--------------|
| EMPLOYEE  | Own data, personal OKRs, assigned reviews |
| MANAGER   | Team data, team PIPs, team OKR reviews |
| HR        | Full access to all modules and actions |

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for JWT token signing |
| JWT_EXPIRES_IN | Token expiration (default: 7d) |
| PLUNK_API_KEY | Plunk email service API key |
| PORT | Server port (default: 3000) |

## Development

```bash
# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Run in production
npm run start:prod
```

## Database

The schema uses multi-tenancy with `organizationId` on all tenant-scoped tables. The Prisma middleware automatically filters queries by the authenticated user's organization.
