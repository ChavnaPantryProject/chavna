# Documentation for User Account Related Requests

# Login

Retuns a login token that is valid for 2 weeks (duration subject to change).
## Request
### Endpoint: ```https://api.chavnapantry.com/login```
### Method: ```POST```
### Body:
```ts
{
  email: string,
  password: string
}
```
## Response
### Success:
Message: ```'Succesful login.'```

Payload: 
```ts
{
  jwt: string // Signed Json Web Token to be used for Authorization header
}
```
### Fail:
Message: ```'Invalid login credentials'```

[//]: ############################################################################################################
<br/><br/>

# Create Account

Sends the email a verification link that will create an account with the desired email and password
## Request
### Endpoint: ```https://api.chavnapantry.com/create-account```
### Method: ```POST```
### Body:
```ts
{
  email: string,
  password: string
}
```
## Response
### Success:
Message: ```'Confirmation email sent.'```

### Fail:
Status: ```409```

Message: ```'User with email already exists.'```

[//]: ############################################################################################################
<br/><br/>

# User Exists

Used to check weather an email address has already been registered.
## Request
### Endpoint: ```https://api.chavnapantry.com/user-exists```
### Method: ```POST```
### Body:
```ts
{
  email: string
}
```
## Response
### Success:
Payload:
```ts
{
  exists: boolean
}
```

[//]: ############################################################################################################
<br/><br/>

# Refresh Token

Used to get a fresh login token from an existing (still valid) login token.
## Request
### Endpoint: ```https://api.chavnapantry.com/refresh-token```
### Method: ```GET```
### Headers:
```
Authorization: Bearer <jwt>
```
## Response
### Success:
Payload:
```ts
{
  jwt: string // new login token
}
```

[//]: ############################################################################################################
<br/><br/>