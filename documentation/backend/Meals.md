
# Create Meal

Creates a meal with a name and list of ingredients.
## Request
### Endpoint: ```https://api.chavnapantry.com/create-meal```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    name: string, // Name of meal
    ingredients: [
        {
            templateId: string, // uuid of food item template (See Pantry.md)
            amount: number
        }
    ]
}
```
## Response
### Success:
Payload:
```ts
{
    mealId: stirng, // uuid
    ingredientsAdded: number // should be equal to length of ingredients array
}
```

### Fail:
Message: ```Failed to add some ingredients.```

Payload:
```ts
{
    mealId: stirng, // uuid
    ingredientsAdded: number // how many ingredients actually got added.
}
```

### Fail:
Message: ```Meal with that name already exists.```

[//]: ############################################################################################################
<br/><br/>

# Get Meal

Gets the contents of a meal from a meal id.
## Request
### Endpoint: ```https://api.chavnapantry.com/get-meal```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    mealId: string // uuid
}
```
## Response
### Success:
Payload:
```ts
{
    meal: {
        name: string,
        ingredients: [
            {
                templateId: string, // uuid
                name: string,
                amount: number,
                unit: string
            },
            ...
        ]
    }
}
```

[//]: ############################################################################################################
<br/><br/>

# Update Meal

Updates a meal with a name and list of ingredients. Both are optional.
## Request
### Endpoint: ```https://api.chavnapantry.com/update-meal```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    name?: string, // Name of meal
    ingredients?: [
        {
            templateId: string, // uuid of food item template (See Pantry.md)
            amount: number
        }
    ]
}
```
## Response
### Success:
Payload:
```ts
{
    ingredientsAdded: number // should be equal to length of ingredients array
}
```

### Fail:
Message: ```Failed to add some ingredients.```

Payload:
```ts
{
    ingredientsAdded: number // how many ingredients actually got added.
}
```

### Fail:
Message: ```Meal ID Not Found.```