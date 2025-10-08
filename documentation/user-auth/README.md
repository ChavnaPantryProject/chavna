# REST API Documentation for ```user-auth``` Service
This page documents the expected request and response bodies.
# Login
### Endpoint
  ```http://our.server.com/login```
### Request
#### Body
```
{
  "email": "user email",
  "password": "user password"
}
```
### Response
#### Body
Successful login
```
{
  "success": "success",
  "payload": {
    "jwtToken": "signed JWT"
  },
  "message": "Succesful login."
}
```
Invalid login
```
{
  "success": "error",
  "payload": null,
  "message": "Invalid login credentials"
}
```
# Create Account
### Endpoint
  ```http://our.server.com/create-account```
### Request
#### Body
```
{
  "email": "user email",
  "password": "user password"
}
```
### Response
#### Body
Success
```
{
  "success": "success",
  "payload": null,
  "message": "Account created succesfully"
}
```
User already exists
```
{
  "timestamp": "2025-10-06T18:53:10.873+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "User with email already exists.",
  "path": "/create-account"
}
```
