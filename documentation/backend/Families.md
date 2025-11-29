# Documentation for Family Related Requests

# Create Family

Create a family for the authorized user.
## Request
### Endpoint: ```https://api.chavnapantry.com/create-family```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
## Response
### Success:
Message: ```'Family Created'```

### Fail:
Status: ```409```

Message: ```'User already part of a family.'```

[//]: ############################################################################################################
<br/><br/>

# Leave Family

Leave the current family for the authorized user. The owner of a family cannot leave. They must delete the family.
## Request
### Endpoint: ```https://api.chavnapantry.com/leave-family```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
## Response
### Success:
Message: ```'Left family'```

### Fail (User is owner):
Status: ```409```

Message: ```'Cannot leave family as owner.'```
### Fail (User is not in a family):
Status: ```409```

Message: ```'User not part of a family.'```

[//]: ############################################################################################################
<br/><br/>

# Delete Family

Delete the current authorized user's family. User must be owner to delete.
## Request
### Endpoint: ```https://api.chavnapantry.com/delete-family```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
## Response
### Success:
Message: ```'Deleted family'```

### Fail (User is not owner):
Status: ```409```

Message: ```'Only owner can delete family.'```
### Fail (User is not in a family):
Status: ```409```

Message: ```'User not part of a family.'```

[//]: ############################################################################################################
<br/><br/>

# Invite to Family

Sends an email invite to your family. Can only be done by owner.
## Request
### Endpoint: ```https://api.chavnapantry.com/invite-to-family```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
  email: string // email address to send invite to
}
```
## Response
### Success:
Message: ```'Invitation sent.'```

### Fail (User is not owner):
Status: ```409```

Message: ```'Only owner can invite members.'```
### Fail (User is not in a family):
Status: ```409```

Message: ```'User not part of a family.'```
### Fail (Invited user does not exist)
Status: ```404```

Message: ```'User with email does not exist.'```
### Fail (Invited user is the same as authorized user)
Status: ```400```

Message: ```'Cannot invite yourself.'```

[//]: ############################################################################################################
<br/><br/>



# Get Family Members
### Endpoint
  ```https://api.chavnapantry.com/get-family-members```

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

# Get Family Members

Returns a list of current family members.
## Request
### Endpoint: ```https://api.chavnapantry.com/get-family-members```
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
    members: [
        // User 1
        {
            userId: string, // UUID represented as string
            email: string,
            role: 'None' | 'Owner' | 'Member'
        },
        // User 2
        { 
            userId: string, // UUID represented as string
            email: string,
            role: 'None' | 'Owner' | 'Member'
        },
        
        ...

        // User n
        {
            userId: string, // UUID represented as string
            email: string,
            role: 'None' | 'Owner' | 'Member'
        }
    ]
}
```

[//]: ############################################################################################################
<br/><br/>