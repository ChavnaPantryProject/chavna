# REST API Documentation for ```user-auth``` Service
This page documents the expected request and response bodies.
# Login
### Endpoint
  ```https://api.chavnapantry.com/login```
#### Description
Retuns a login token that is valid for 2 weeks (duration subject to change).
### Request
#### Method
```POST```
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
  ```https://api.chavnapantry.com/create-account```
### Request
#### Method
```POST```
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
  "message": "Confirmation email sent."
}
```
User already exists (THIS CURRENTLY DOESNT WORK)
```
{
  "timestamp": "2025-10-06T18:53:10.873+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "User with email already exists.",
  "path": "/create-account"
}
```




# User Exists
### Endpoint
  ```https://api.chavnapantry.com/user-exists```
### Request
#### Method
```GET```
#### Body
```
{
  "email": "user email"
}
```




# Refresh Token
### Endpoint
  ```https://api.chavnapantry.com/refresh-token```
#### Description
Used to get a fresh login token
### Request
#### Method
```GET```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
None




# Get Personal Info
### Endpoint
  ```https://api.chavnapantry.com/get-personal-info```
#### Description
Returns personal info
### Request
#### Method
```GET```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
Note: Authorization only required if user has set their info to private
#### Body
```
{
  "email": "user email"
}
```
or
```
{
  "userId": "user uuid"
}
```




# Set Personal Info
### Endpoint
  ```https://api.chavnapantry.com/set-personal-info```
#### Description
Sets personal info
### Request
#### Method
```POST```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
```
{
  "first_name": string,
  "last_name": string,
  "birth_date": string?, // might not be a string, haven't tested it
  "bio": string,
  "nickname": string,
  "public": bool
}
```
Note: No fields are required. You can use as many or as few as you want.





# Create Family
### Endpoint
  ```https://api.chavnapantry.com/create-family```
#### Description
Creates a family
### Request
#### Method
```POST```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
None




# Leave Family
### Endpoint
  ```https://api.chavnapantry.com/leave-family```
#### Description
Leaves the current family. Does not work if you are the owner.
### Request
#### Method
```POST```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
None




# Delete Family
### Endpoint
  ```https://api.chavnapantry.com/delete-family```
#### Description
Deletes the current family. Can only be done by owner.
### Request
#### Method
```POST```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
None




# Invite to Family
### Endpoint
  ```https://api.chavnapantry.com/invite-to-family```
#### Description
Sends an email invite to your family. Can only be done by owner.
### Request
#### Method
```POST```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
```
{
  "email": "user email"
}
```




# Get Family Members
### Endpoint
  ```https://api.chavnapantry.com/get-family-members```
#### Description
Deletes the current family. Can only be done by owner.
### Request
#### Method
```GET```
#### Headers
```
"Authorization": "Bearer <jwt>"
```
#### Body
None
