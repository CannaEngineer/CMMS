
# Testing

This document outlines the testing procedures for the CMMS application.

## Backend Testing

The backend is tested using Jest and Supertest. To run the backend tests, navigate to the `backend` directory and run the following command:

```bash
npm test
```

## Frontend Testing

The frontend is tested using Vitest and React Testing Library. To run the frontend tests, navigate to the `frontend` directory and run the following command:

```bash
npm test
```

## End-to-End (E2E) Testing

The E2E tests are run using Cypress. To run the E2E tests, you must first have the frontend and backend servers running. 

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the frontend server:

```bash
cd frontend
npm run dev
```

3. Once both servers are running, you can run the E2E tests with the following command in the `frontend` directory:

```bash
npm run test:e2e
```
