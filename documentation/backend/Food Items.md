
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
