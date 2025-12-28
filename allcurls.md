# User Service API cURLs

Base URL: `http://localhost:8080`

## Authentication

### Send OTP
```bash
curl --location 'http://localhost:8080/auth/send-otp' \
--header 'Content-Type: application/json' \
--data '{
    "phone": "+1234567890",
    "source": "login"
}'
```
**Response:**
```json
{
    "status": "success",
    "statusCode": 200,
    "message": "otp sent",
    "data": {
        "phone": "+1234567890",
        "expiresAt": "2023-10-27T10:05:00Z"
    }
}
```

### Verify OTP
```bash
curl --location 'http://localhost:8080/auth/verify-otp' \
--header 'Content-Type: application/json' \
--data '{
    "phone": "+1234567890",
    "otp": "123456",
    "userType": "customer"
}'
```
**Response:**
```json
{
    "status": "success",
    "statusCode": 200,
    "message": "authenticated",
    "data": {
        "authToken": "eyJhbGciOiJIUzI1Ni..."
    }
}
```

## User Management

### Create User
```bash
curl --location 'http://localhost:8080/users/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "john.doe@example.com",
    "phone": "+19876543210",
    "password": "StrongPassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "primary_role": "customer"
}'
```
**Response:**
```json
{
    "status": "success",
    "statusCode": 201,
    "message": "user created successfully",
    "data": {
        "authToken": "eyJhb...",
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "john.doe@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "full_name": "John Doe",
            "primary_role": "customer",
            "phone_verified": false
        }
    }
}
```

### Login User
```bash
curl --location 'http://localhost:8080/users/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "john.doe@example.com",
    "password": "StrongPassword123!"
}'
```
**Response:**
```json
{
    "status": "success",
    "statusCode": 200,
    "message": "Login successful",
    "data": {
        "authToken": "eyJhb...",
        "email": "john.doe@example.com",
        "id": "550e8400-e29b-41d4-a716-446655440000"
    }
}
```

### Get All Users (Paginated)
```bash
curl --location 'http://localhost:8080/users/?page=1&limit=10' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```
**Response:**
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john.doe@example.com",
        "primary_role": "customer",
        "created_at": "2023-10-27T10:00:00Z"
    }
]
```

### Get User by ID
```bash
curl --location 'http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

### Update User
```bash
curl --location --request PUT 'http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "first_name": "Johnny",
    "display_name": "Johnny D"
}'
```

### Delete User
```bash
curl --location --request DELETE 'http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

## Address Management

### Create Address
```bash
curl --location 'http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000/addresses' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "label": "Home",
    "address_line1": "123 Main St",
    "city": "Metropolis",
    "state": "NY",
    "pincode": "10001",
    "is_default": true
}'
```
**Response:**
```json
{
    "status": "success",
    "statusCode": 201,
    "message": "address created",
    "data": {
        "address": {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "label": "Home",
            "city": "Metropolis"
        }
    }
}
```

### Get User Addresses (Paginated)
```bash
curl --location 'http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000/addresses?page=1&limit=5' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

### Update Address
```bash
curl --location --request PUT 'http://localhost:8080/addresses/a1b2c3d4-e5f6-7890-1234-567890abcdef' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "address_line1": "456 Side St",
    "city": "Gotham"
}'
```

### Delete Address
```bash
curl --location --request DELETE 'http://localhost:8080/addresses/a1b2c3d4-e5f6-7890-1234-567890abcdef' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

## Roles & Permissions

### Create Role
```bash
curl --location 'http://localhost:8080/roles/' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "name": "manager",
    "description": "Store Manager"
}'
```

### Assign Permission
```bash
curl --location 'http://localhost:8080/roles/assign' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
    "role_id": 1,
    "permission_id": 5
}'
```
Restaurant Service API Reference
Authentication
Most endpoints require a JWT token. Header: Authorization: Bearer <your_token>

Restaurant Management
1. Create Restaurant (Owner)
Endpoint: POST /restaurants/ Auth: Required (Token)

curl --location 'http://localhost:8082/restaurants/' \
--header 'Authorization: Bearer <TOKEN>' \
--form 'name="My Gourmet Burger"' \
--form 'address="123 Food Street"' \
--form 'phone="9876543210"' \
--form 'email="contact@burger.com"' \
--form 'cuisine_type="American"' \
--form 'logo=@"/path/to/logo.png"' \
--form 'fssai_license=@"/path/to/cert.pdf"'
Response:

{
    "status": "success",
    "message": "restaurant created",
    "data": {
        "restaurant": {
            "id": 101,
            "name": "My Gourmet Burger",
            "slug": "my-gourmet-burger",
            "owner_id": "uuid-string-of-user"
        }
    }
}
2. Get My Restaurant (Owner)
Endpoint: GET /restaurants/byid Auth: Required (Owner)

curl --location 'http://localhost:8082/restaurants/byid' \
--header 'Authorization: Bearer <TOKEN>'
Response:

{
    "status": "success",
    "message": "restaurant fetched",
    "data": {
        "restaurant": {
            "id": 101,
            "name": "My Gourmet Burger",
            "is_onboarded": true,
            "verification_status": "verified"
        }
    }
}
3. Update Restaurant Details (Owner)
Endpoint: PUT /restaurants/:id Auth: Required (Owner)

curl --location --request PUT 'http://localhost:8082/restaurants/101' \
--header 'Authorization: Bearer <TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "name": "My Gourmet Burger & Fries",
    "phone": "9998887776",
    "description": "Best burgers in town"
}'
Response:

{
    "status": "success",
    "message": "restaurant updated",
    "data": {
        "ok": true
    }
}
4. Patch Restaurant Attributes (Owner)
Endpoint: PATCH /restaurants/:id Auth: Required (Owner) Useful for partial updates like toggling availability.

curl --location --request PATCH 'http://localhost:8082/restaurants/101' \
--header 'Authorization: Bearer <TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "is_open": true
}'
5. Get Restaurant Public Details (Customer/Public)
Endpoint: GET /restaurants/public/:id Auth: None

curl --location 'http://localhost:8082/restaurants/public/101'
Response:

{
    "status": "success",
    "message": "restaurant fetched",
    "data": {
        "restaurant": {
            "id": 101,
            "name": "My Gourmet Burger",
            "address": "123 Food Street",
            "is_open": true
        }
    }
}
6. List All Restaurants (Public)
Endpoint: GET /restaurants/ Auth: None

curl --location 'http://localhost:8082/restaurants/?page=1&limit=10'
Order Management
1. Place Order (Customer)
Endpoint: POST /orders Auth: Required (Token - Customer)

curl --location 'http://localhost:8082/orders' \
--header 'Authorization: Bearer <TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "restaurantId": 101,
    "totalAmount": 450.00,
    "items": [
        {
            "name": "Cheese Burger",
            "qty": 2,
            "unitPrice": 150,
            "totalPrice": 300,
            "menuItemId": 501
        },
        {
            "name": "Fries",
            "qty": 1,
            "unitPrice": 150,
            "totalPrice": 150
        }
    ],
    "deliveryAddress": "Flat 4B, Residency"
}'
Response:

{
    "status": "success",
    "message": "order placed",
    "data": {
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "createdAt": "2025-12-27T15:30:00Z"
    }
}
2. Get All Orders for Restaurant (Owner/Staff)
Endpoint: GET /restaurants/orders Auth: Required (Owner/Staff)

curl --location 'http://localhost:8082/restaurants/orders?status=pending&page=1&limit=20' \
--header 'Authorization: Bearer <TOKEN>'
Response:

{
    "status": "success",
    "message": "orders fetched successfully",
    "data": {
        "orders": [
            {
                "id": 1,
                "order_status": "pending",
                "total_amount": 450.00
            }
        ],
        "pagination": {
            "total": 1,
            "page": 1
        }
    }
}
3. Update Order Status (Staff)
Endpoint: PUT /orders/:id/status Auth: Required (Staff/Owner)

curl --location --request PUT 'http://localhost:8082/orders/1/status' \
--header 'Authorization: Bearer <TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "status": "confirmed"
}'
Response:

{
    "status": "success",
    "message": "order status updated"
}