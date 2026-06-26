# Rewards Service

A RESTful service for managing reward definitions and calculating rewards. Built with TypeScript, Express, and SQLite using Drizzle ORM.

## Features

- Create, read, update, and delete reward definitions
- Support for fixed rewards (guaranteed rewards) and random rewards (chance-based rewards with weighted selection)
- Claim rewards to calculate awarded amounts based on reward configuration
- Validation middleware for request payloads and IDs
- Error handling with appropriate HTTP status codes
- Dependency injection using tsyringe
- SQLite database with Drizzle ORM

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express v5
- **Database**: SQLite (via better-sqlite3)
- **ORM**: Drizzle ORM
- **DI**: tsyringe
- **Validation**: express-validator, zod
- **Testing**: Vitest, Supertest

## Project Structure

```
src/
├── app.ts                    # Application entry point
├── container/                # Dependency injection setup
├── controllers/              # Request handlers
├── db/                       # Database schema and client
├── domain/                   # Domain models and types
├── errors/                   # Custom error classes
├── middlewares/              # Express middlewares (validation, error handling)
├── repositories/             # Data access layer
├── routes/                   # API routes
└── services/                 # Business logic
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Health check endpoint |
| GET | `/api/v1/rewards` | List all reward definitions |
| POST | `/api/v1/rewards` | Create a new reward definition |
| GET | `/api/v1/rewards/:id` | Get a specific reward definition |
| PATCH | `/api/v1/rewards/:id` | Update a reward definition |
| DELETE | `/api/v1/rewards/:id` | Delete a reward definition |
| POST | `/api/v1/rewards/:id/claim` | Claim/calculate rewards for a reward definition |

## Reward Structure

Rewards can have both fixed and random components:

```json
{
  "name": "Daily Login",
  "enabled": true,
  "content": [
    {
      "type": "fixed",
      "rewards": [
        { "resource": "xp", "amount": 100 },
        { "resource": "currency", "amount": 50 }
      ]
    },
    {
      "type": "random",
      "rewards": [
        { "resource": "energy", "chance": 30, "amount": 10 },
        { "resource": "currency", "chance": 50, "minAmount": 5, "maxAmount": 20 },
        { "resource": "xp", "chance": 20, "minAmount": 50, "maxAmount": 100 }
      ]
    }
  ]
}
```

**Resource types**: `energy`, `currency`, `xp`

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

```bash
npm install
```

### Database Setup

Generate and push the database schema:

```bash
npm run db:generate
npm run db:push
```

### Running the Service

**Development/Production:**

```bash
npm run build
npm start
```

The service will start on port `8080` by default (configurable via `PORT` environment variable).

### Testing

Run all tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Clean Up

Remove build artifacts and coverage:

```bash
npm run clean
```

Remove database and migrations:

```bash
npm run db:clean
```

## Error Handling

The service returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (on successful deletion)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate reward name, disabled reward claim)
- `400`/validation errors - Handled by validation middleware

## License

See [LICENSE](LICENSE) for details.
