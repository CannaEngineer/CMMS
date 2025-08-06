# CMMS Project Documentation

Welcome to the documentation for the CMMS (Computerized Maintenance Management System) project. This document serves as a central hub for all project-related information, including setup instructions, architecture overview, API documentation, and deployment guides.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Quick Start (Development)](#2-quick-start-development)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Mobile Setup](#mobile-setup)
3.  [API Documentation](#3-api-documentation)
4.  [Deployment Guide](#4-deployment-guide)
5.  [Design Document](#5-design-document)

---

## 1. Project Overview

**Compass CMMS** is a compliance-first, mobile-optimized computerized maintenance management system with AI-enhanced tools and an integrated advertising-driven marketplace.

### Core Goals
-   MVP delivery in 12 months with mobile-first UX
-   Advertising-based monetization without workflow disruption  
-   Privacy compliance (GDPR, CCPA)
-   Scale to 50,000+ users across industries

---

## 2. Quick Start (Development)

This section provides instructions to get the CMMS project running in your local development environment.

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Apply Prisma schema changes and import initial data:
    ```bash
    npx prisma db push --accept-data-loss
    npx ts-node src/import/importLocations.ts
    npx ts-node src/import/importAssets.ts
    npx ts-node src/import/importVendors.ts
    npx ts-node src/import/importParts.ts
    npx ts-node src/import/importWorkOrders.ts
    npx ts-node src/tools/assignDataToAdmin.ts # Assign all data to admin
    ```
4.  Start the backend development server:
    ```bash
    npm run dev
    ```

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```

### Mobile Setup

1.  Navigate to the `mobile` directory:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the mobile application (choose your platform):
    ```bash
    npm run ios # For iOS simulator
    # OR
    npm run android # For Android emulator
    ```

---

## 3. API Documentation

Detailed documentation for the CMMS backend API can be found [here](./API_DOCUMENTATION.md).

---

## 4. Deployment Guide

For instructions on deploying the CMMS application, refer to the [Deployment Guide](./DEPLOYMENT_GUIDE.md).

---

## 5. Design Document

For a comprehensive overview of the project's architecture, technology stack, and design decisions, please see the [Design Document](./DESIGN_DOC.md).
