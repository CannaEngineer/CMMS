# CMMS Backend API Documentation

This document outlines the RESTful API endpoints for the CMMS (Computerized Maintenance Management System) backend.

**Base URL:** `http://localhost:3000/api` (Replace with your actual backend URL)

---

## 1. Authentication (`/api/auth`)

### 1.1 Register User

-   **Endpoint:** `/api/auth/register`
-   **Method:** `POST`
-   **Description:** Registers a new user.
-   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "name": "John Doe",
      "password": "securepassword",
      "organizationId": 1,
      "role": "TECHNICIAN"
    }
    ```
-   **Response:**
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "TECHNICIAN",
      "organizationId": 1,
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{
            "email": "newuser@example.com",
            "name": "New User",
            "password": "password123",
            "organizationId": 1,
            "role": "TECHNICIAN"
          }'
    ```

### 1.2 Login User

-   **Endpoint:** `/api/auth/login`
-   **Method:** `POST`
-   **Description:** Authenticates a user and returns a JWT token.
-   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```
-   **Response:**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "role": "ADMIN"
      }
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
            "email": "user@example.com",
            "password": "securepassword"
          }'
    ```

---

## 2. Assets (`/api/assets`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 2.1 Get All Assets

-   **Endpoint:** `/api/assets`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all assets.
-   **Response:**
    ```json
    [
      {
        "id": 1,
        "name": "HVAC Unit 1",
        "description": "Main HVAC unit for building A",
        "serialNumber": "HVAC-001",
        "modelNumber": "XYZ-123",
        "manufacturer": "ACME Inc.",
        "year": 2020,
        "status": "ONLINE",
        "criticality": "HIGH",
        "barcode": "123456789",
        "imageUrl": null,
        "attachments": null,
        "locationId": 1,
        "organizationId": 1,
        "parentId": null,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      }
    ]
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/assets \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 2.2 Get Asset by ID

-   **Endpoint:** `/api/assets/:id`
-   **Method:** `GET`
-   **Description:** Retrieves a single asset by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the asset.
-   **Response:**
    ```json
    {
      "id": 1,
      "name": "HVAC Unit 1",
      "description": "Main HVAC unit for building A",
      "serialNumber": "HVAC-001",
      "modelNumber": "XYZ-123",
      "manufacturer": "ACME Inc.",
      "year": 2020,
      "status": "ONLINE",
      "criticality": "HIGH",
      "barcode": "123456789",
      "imageUrl": null,
      "attachments": null,
      "locationId": 1,
      "organizationId": 1,
      "parentId": null,
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/assets/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 2.3 Create New Asset

-   **Endpoint:** `/api/assets`
-   **Method:** `POST`
-   **Description:** Creates a new asset.
-   **Request Body:**
    ```json
    {
      "name": "New Asset",
      "description": "Description of new asset",
      "serialNumber": "SN-001",
      "modelNumber": "MDL-001",
      "manufacturer": "ManuCorp",
      "year": 2023,
      "status": "ONLINE",
      "criticality": "MEDIUM",
      "barcode": "BARCODE-001",
      "locationId": 1,
      "parentId": null
    }
    ```
-   **Response:** (Same as Get Asset by ID)
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/assets \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "name": "New Asset",
            "description": "Description of new asset",
            "serialNumber": "SN-001",
            "modelNumber": "MDL-001",
            "manufacturer": "ManuCorp",
            "year": 2023,
            "status": "ONLINE",
            "criticality": "MEDIUM",
            "barcode": "BARCODE-001",
            "locationId": 1
          }'
    ```

### 2.4 Update Asset

-   **Endpoint:** `/api/assets/:id`
-   **Method:** `PUT`
-   **Description:** Updates an existing asset by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the asset to update.
-   **Request Body:** (Partial or full asset object, e.g., to change name and status)
    ```json
    {
      "name": "Updated HVAC Unit 1",
      "status": "OFFLINE"
    }
    ```
-   **Response:** (Same as Get Asset by ID, with updated fields)
-   **Example `curl`:**
    ```bash
    curl -X PUT http://localhost:3000/api/assets/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "name": "Updated HVAC Unit 1",
            "status": "OFFLINE"
          }'
    ```

### 2.5 Delete Asset

-   **Endpoint:** `/api/assets/:id`
-   **Method:** `DELETE`
-   **Description:** Deletes an asset by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the asset to delete.
-   **Response:**
    ```json
    {
      "message": "Asset deleted successfully"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X DELETE http://localhost:3000/api/assets/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

---

## 3. Locations (`/api/locations`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 3.1 Get All Locations

-   **Endpoint:** `/api/locations`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all locations.
-   **Response:**
    ```json
    [
      {
        "id": 1,
        "name": "Building A",
        "description": "Main production building",
        "address": "123 Industrial Rd",
        "organizationId": 1,
        "parentId": null,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      }
    ]
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/locations \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 3.2 Get Location by ID

-   **Endpoint:** `/api/locations/:id`
-   **Method:** `GET`
-   **Description:** Retrieves a single location by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the location.
-   **Response:** (Same as Get All Locations, single object)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/locations/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 3.3 Create New Location

-   **Endpoint:** `/api/locations`
-   **Method:** `POST`
-   **Description:** Creates a new location.
-   **Request Body:**
    ```json
    {
      "name": "Warehouse B",
      "description": "Storage facility",
      "address": "456 Storage Ave",
      "parentId": 1
    }
    ```
-   **Response:** (Same as Get Location by ID)
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/locations \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "name": "Warehouse B",
            "description": "Storage facility",
            "address": "456 Storage Ave",
            "parentId": 1
          }'
    ```

### 3.4 Update Location

-   **Endpoint:** `/api/locations/:id`
-   **Method:** `PUT`
-   **Description:** Updates an existing location by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the location to update.
-   **Request Body:** (Partial or full location object)
    ```json
    {
      "name": "Updated Building A"
    }
    ```
-   **Response:** (Same as Get Location by ID, with updated fields)
-   **Example `curl`:**
    ```bash
    curl -X PUT http://localhost:3000/api/locations/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "name": "Updated Building A"
          }'
    ```

### 3.5 Delete Location

-   **Endpoint:** `/api/locations/:id`
-   **Method:** `DELETE`
-   **Description:** Deletes a location by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the location to delete.
-   **Response:**
    ```json
    {
      "message": "Location deleted successfully"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X DELETE http://localhost:3000/api/locations/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

---

## 4. Work Orders (`/api/work-orders`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 4.1 Get All Work Orders

-   **Endpoint:** `/api/work-orders`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all work orders.
-   **Response:**
    ```json
    [
      {
        "id": 1,
        "title": "Fix broken pump",
        "description": "Pump in section C is making strange noises.",
        "status": "OPEN",
        "priority": "HIGH",
        "assetId": 1,
        "assignedToId": 2,
        "organizationId": 1,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      }
    ]
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/work-orders \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 4.2 Get Work Order by ID

-   **Endpoint:** `/api/work-orders/:id`
-   **Method:** `GET`
-   **Description:** Retrieves a single work order by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the work order.
-   **Response:** (Same as Get All Work Orders, single object)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/work-orders/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 4.3 Create New Work Order

-   **Endpoint:** `/api/work-orders`
-   **Method:** `POST`
-   **Description:** Creates a new work order.
-   **Request Body:**
    ```json
    {
      "title": "New Work Order",
      "description": "Details of the new work order.",
      "status": "OPEN",
      "priority": "MEDIUM",
      "assetId": 1,
      "assignedToId": 2
    }
    ```
-   **Response:** (Same as Get Work Order by ID)
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/work-orders \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "title": "New Work Order",
            "description": "Details of the new work order.",
            "status": "OPEN",
            "priority": "MEDIUM",
            "assetId": 1,
            "assignedToId": 2
          }'
    ```

### 4.4 Update Work Order

-   **Endpoint:** `/api/work-orders/:id`
-   **Method:** `PUT`
-   **Description:** Updates an existing work order by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the work order to update.
-   **Request Body:** (Partial or full work order object)
    ```json
    {
      "status": "IN_PROGRESS",
      "assignedToId": 3
    }
    ```
-   **Response:** (Same as Get Work Order by ID, with updated fields)
-   **Example `curl`:**
    ```bash
    curl -X PUT http://localhost:3000/api/work-orders/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "status": "IN_PROGRESS",
            "assignedToId": 3
          }'
    ```

### 4.5 Delete Work Order

-   **Endpoint:** `/api/work-orders/:id`
-   **Method:** `DELETE`
-   **Description:** Deletes a work order by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the work order to delete.
-   **Response:**
    ```json
    {
      "message": "Work order deleted successfully"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X DELETE http://localhost:3000/api/work-orders/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

---

## 5. Parts (`/api/parts`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 5.1 Get All Parts

-   **Endpoint:** `/api/parts`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all parts.
-   **Response:**
    ```json
    [
      {
        "id": 1,
        "name": "Bearing 6205",
        "description": "Standard ball bearing",
        "sku": "BRG-6205",
        "stockLevel": 50,
        "reorderPoint": 10,
        "organizationId": 1,
        "supplierId": 1,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      }
    ]
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/parts \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 5.2 Get Low Stock Parts

-   **Endpoint:** `/api/parts/low-stock`
-   **Method:** `GET`
-   **Description:** Retrieves a list of parts with stock levels below their reorder point.
-   **Response:** (Same as Get All Parts, filtered list)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/parts/low-stock \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 5.3 Get Part by ID

-   **Endpoint:** `/api/parts/:id`
-   **Method:** `GET`
-   **Description:** Retrieves a single part by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the part.
-   **Response:** (Same as Get All Parts, single object)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/parts/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 5.4 Create New Part

-   **Endpoint:** `/api/parts`
-   **Method:** `POST`
-   **Description:** Creates a new part.
-   **Request Body:**
    ```json
    {
      "name": "New Gasket",
      "description": "Rubber gasket for pump",
      "sku": "GSK-001",
      "stockLevel": 100,
      "reorderPoint": 20,
      "supplierId": 1
    }
    ```
-   **Response:** (Same as Get Part by ID)
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/parts \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "name": "New Gasket",
            "description": "Rubber gasket for pump",
            "sku": "GSK-001",
            "stockLevel": 100,
            "reorderPoint": 20,
            "supplierId": 1
          }'
    ```

### 5.5 Update Part

-   **Endpoint:** `/api/parts/:id`
-   **Method:** `PUT`
-   **Description:** Updates an existing part by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the part to update.
-   **Request Body:** (Partial or full part object)
    ```json
    {
      "description": "Updated description for gasket"
    }
    ```
-   **Response:** (Same as Get Part by ID, with updated fields)
-   **Example `curl`:**
    ```bash
    curl -X PUT http://localhost:3000/api/parts/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "description": "Updated description for gasket"
          }'
    ```

### 5.6 Update Stock Level

-   **Endpoint:** `/api/parts/:id/stock`
-   **Method:** `PATCH`
-   **Description:** Updates the stock level of a part.
-   **Path Parameters:**
    -   `id` (integer): The ID of the part.
-   **Request Body:**
    ```json
    {
      "change": 5,
      "type": "add"
    }
    ```
    or
    ```json
    {
      "change": 2,
      "type": "remove"
    }
    ```
-   **Response:** (Updated Part object)
-   **Example `curl` (add stock):**
    ```bash
    curl -X PATCH http://localhost:3000/api/parts/1/stock \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "change": 5,
            "type": "add"
          }'
    ```
-   **Example `curl` (remove stock):**
    ```bash
    curl -X PATCH http://localhost:3000/api/parts/1/stock \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "change": 2,
            "type": "remove"
          }'
    ```

### 5.7 Delete Part

-   **Endpoint:** `/api/parts/:id`
-   **Method:** `DELETE`
-   **Description:** Deletes a part by its ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the part to delete.
-   **Response:**
    ```json
    {
      "message": "Part deleted successfully"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X DELETE http://localhost:3000/api/parts/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

---

## 6. Users (`/api/users`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 6.1 Get All Users

-   **Endpoint:** `/api/users`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all users.
-   **Response:**
    ```json
    [
      {
        "id": 1,
        "email": "admin@example.com",
        "name": "Admin User",
        "role": "ADMIN",
        "organizationId": 1,
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      }
    ]
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/users \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 6.2 Get User Stats

-   **Endpoint:** `/api/users/stats`
-   **Method:** `GET`
-   **Description:** Retrieves statistics related to users (e.g., count by role).
-   **Response:**
    ```json
    {
      "totalUsers": 5,
      "usersByRole": {
        "ADMIN": 1,
        "MANAGER": 1,
        "TECHNICIAN": 3
      }
    }
    ```
-   **Example `curl`:
    ```bash
    curl -X GET http://localhost:3000/api/users/stats \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 6.3 Get User by ID

-   **Endpoint:** `/api/users/:id`
-   **Method:** `GET`
-   **Description:** Retrieves a single user by their ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the user.
-   **Response:** (Same as Get All Users, single object)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/users/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 6.4 Get User Work Orders

-   **Endpoint:** `/api/users/:id/work-orders`
-   **Method:** `GET`
-   **Description:** Retrieves work orders assigned to a specific user.
-   **Path Parameters:**
    -   `id` (integer): The ID of the user.
-   **Response:** (Array of Work Order objects, similar to Get All Work Orders)
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/users/1/work-orders \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 6.5 Create New User

-   **Endpoint:** `/api/users`
-   **Method:** `POST`
-   **Description:** Creates a new user.
-   **Request Body:**
    ```json
    {
      "email": "newtech@example.com",
      "name": "New Technician",
      "password": "securepassword",
      "organizationId": 1,
      "role": "TECHNICIAN"
    }
    ```
-   **Response:** (Same as Get User by ID)
-   **Example `curl`:**
    ```bash
    curl -X POST http://localhost:3000/api/users \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "email": "newtech@example.com",
            "name": "New Technician",
            "password": "securepassword",
            "organizationId": 1,
            "role": "TECHNICIAN"
          }'
    ```

### 6.6 Update User

-   **Endpoint:** `/api/users/:id`
-   **Method:** `PUT`
-   **Description:** Updates an existing user by their ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the user to update.
-   **Request Body:** (Partial or full user object)
    ```json
    {
      "role": "MANAGER"
    }
    ```
-   **Response:** (Same as Get User by ID, with updated fields)
-   **Example `curl`:**
    ```bash
    curl -X PUT http://localhost:3000/api/users/1 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
      -d '{
            "role": "MANAGER"
          }'
    ```

### 6.7 Delete User

-   **Endpoint:** `/api/users/:id`
-   **Method:** `DELETE`
-   **Description:** Deletes a user by their ID.
-   **Path Parameters:**
    -   `id` (integer): The ID of the user to delete.
-   **Response:**
    ```json
    {
      "message": "User deleted successfully"
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X DELETE http://localhost:3000/api/users/1 \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

---

## 7. Dashboard (`/api/dashboard`)

### Authentication: Required for all endpoints. Include `Authorization: Bearer <token>` header.

### 7.1 Get Dashboard Stats

-   **Endpoint:** `/api/dashboard/stats`
-   **Method:** `GET`
-   **Description:** Retrieves various statistics for the dashboard, including work order, asset, and inventory summaries.
-   **Response:**
    ```json
    {
      "workOrders": {
        "total": 100,
        "byStatus": {
          "OPEN": 20,
          "IN_PROGRESS": 30,
          "COMPLETED": 50
        },
        "overdue": 5
      },
      "assets": {
        "total": 50,
        "byStatus": {
          "ONLINE": 45,
          "OFFLINE": 5
        },
        "maintenanceDue": 3
      },
      "inventory": {
        "lowStock": 10,
        "outOfStock": 2
      }
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/dashboard/stats \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 7.2 Get Work Order Trends

-   **Endpoint:** `/api/dashboard/work-order-trends`
-   **Method:** `GET`
-   **Description:** Retrieves work order creation and completion trends over a specified period.
-   **Query Parameters:**
    -   `period` (string, optional): The period for trends. Can be `week`, `month`, or `year`. Defaults to `month`.
-   **Response:**
    ```json
    [
      {
        "period": "2023-05",
        "created": 10,
        "completed": 8
      },
      {
        "period": "2023-06",
        "created": 12,
        "completed": 10
      }
    ]
    ```
-   **Example `curl` (monthly trends):**
    ```bash
    curl -X GET "http://localhost:3000/api/dashboard/work-order-trends?period=month" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```
-   **Example `curl` (weekly trends):**
    ```bash
    curl -X GET "http://localhost:3000/api/dashboard/work-order-trends?period=week" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 7.3 Get Asset Health

-   **Endpoint:** `/api/dashboard/asset-health`
-   **Method:** `GET`
-   **Description:** Retrieves asset health statistics, including criticality breakdown and recent maintenance.
-   **Response:**
    ```json
    {
      "byCriticality": [
        {
          "name": "HIGH",
          "value": 15
        },
        {
          "name": "MEDIUM",
          "value": 20
        },
        {
          "name": "LOW",
          "value": 15
        }
      ],
      "recentMaintenance": 30,
      "total": 50,
      "healthScore": 60
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/dashboard/asset-health \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 7.4 Get Recent Work Orders

-   **Endpoint:** `/api/dashboard/recent-work-orders`
-   **Method:** `GET`
-   **Description:** Retrieves a list of the most recent work orders.
-   **Query Parameters:**
    -   `limit` (integer, optional): The maximum number of recent work orders to retrieve. Defaults to 10.
-   **Response:** (Array of Work Order objects, similar to Get All Work Orders)
-   **Example `curl`:**
    ```bash
    curl -X GET "http://localhost:3000/api/dashboard/recent-work-orders?limit=5" \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```

### 7.5 Get Maintenance Schedule

-   **Endpoint:** `/api/dashboard/maintenance-schedule`
-   **Method:** `GET`
-   **Description:** Retrieves a summary of maintenance tasks due today and this week.
-   **Response:**
    ```json
    {
      "today": 2,
      "thisWeek": 7
    }
    ```
-   **Example `curl`:**
    ```bash
    curl -X GET http://localhost:3000/api/dashboard/maintenance-schedule \
      -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
    ```
