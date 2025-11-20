# Documentation for Personal Info Related Requests

# Get Personal Info
### Endpoint
  ```https://api.chavnapantry.com/get-personal-info```

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




