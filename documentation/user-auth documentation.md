# REST API Documentation for ```user-auth``` Service
## Login
### Endpoint
  ```server-url/login```
### Request
#### Body
```
{
  "email": "user email",
  "passwor": "user password"
}
```
### Response
#### Body
Successful login.
```
{
  "success": "success",
  "payload": {
    "jwtToken": "signed JWT"
  },
  "message": "Succesful login."
}
```
Invalid login.
```
{
  "success": "error",
  "payload": null,
  "message": "Invalid login credentials"
}
```
