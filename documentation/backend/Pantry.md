
# Create Category

Creates a food category.
## Request
### Endpoint: ```https://api.chavnapantry.com/create-category```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    name: string, // Name of the category
}
```
## Response
### Success:
Message: ```Category created.```

### Fail:
Message: ```Category already exists.```

[//]: ############################################################################################################
<br/><br/>

# Remove Category

Removes a food category.
## Request
### Endpoint: ```https://api.chavnapantry.com/remove-category```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    name: string, // Name of the category
}
```
## Response
### Success:
Message: ```Category removed.```

### Fail:
Message: ```Category not found.```

[//]: ############################################################################################################
<br/><br/>

# Get Categories

Gets all categories.
## Request
### Endpoint: ```https://api.chavnapantry.com/get-categories```
### Method: ```GET```
### Headers:
```
Authorization: Bearer <jwt>
```
## Response
### Success:
Body:
```ts
{
    categories: string[] // Array of category names.
}
```

[//]: ############################################################################################################
<br/><br/>

# Create Food Item Template

Creates a food item template.
## Request
### Endpoint: ```https://api.chavnapantry.com/create-food-item-template```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    name: string,
    amount: number,
    unit: string,
    shelfLifeDays: number, // Shelf life in days (should be an integer)
    category: string
}
```
## Response
### Success:
Payload:
```ts
{
    templateId: string, // string containing a uuid
    template: {
        name: string,
        amount: number,
        unit: string,
        shelfLifeDays: number, // Shelf life in days (should be an integer)
        category: string
    }
}
```

[//]: ############################################################################################################
<br/><br/>

# Get Food Item Templates

Gets all food item templates that match an optional search string. Returns all templates if the search string is ommitted.
## Request
### Endpoint: ```https://api.chavnapantry.com/get-food-item-templates```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    search?: string // Search for templates with a string. Returns all templates if ommitted.
}
```
## Response
### Success:
Payload:
```ts
{
    templates: [
        {
            name: string,
            amount: number, // Default amount for a given food item. This is only for the front end to auto populate an amount field if necessary.
            unit: string,
            shelfLifeDays: number, // Shelf life in days (should be an integer)
            category: string // Must match a user category. Will not add if the category has not been added first.
        },
        ...
    ]
}
```

[//]: ############################################################################################################
<br/><br/>
# Add Food Items

Adds food items to pantry based on a specified template.
## Request
### Endpoint: ```https://api.chavnapantry.com/add-food-items```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    items: [
        {
            templateId: string, // string containing a uuid
            amount: number, // actual amount of food item being added
            unitPrice: number // Price per unit used to calculate meal costs.
        }
    ]
}
```
## Response
### Success:
Message: ```Items added: <number of items>```

### Fail:
Message: ```No items added.``` 

[//]: ############################################################################################################
<br/><br/>

# Get Food Items

Gets all food items in a given category. Returns all food items if category is ommitted.
## Request
### Endpoint: ```https://api.chavnapantry.com/get-food-items```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    category?: string // Get all items in a category. Returns items from all categories if ommitted.
}
```
## Response
### Success:
Payload:
```ts
{
    items: [
        {
            id: string, // Food item id (uuid)
            name: string,
            amount: number,
            unit: string,
            expiration: string, // Expiration date (I believe this should be in the format YYYY-MM-DD)
            lastUsed: string, // Date when this item was last updated.
            unitPrice: number, // Unit price
            addDate: // Date when the item was added
            category: string
        }
    ]
}
```

# Update Food Item

Updates a food item in the pantry.
## Request
### Endpoint: ```https://api.chavnapantry.com/update-food-item```
### Method: ```POST```
### Headers:
```
Authorization: Bearer <jwt>
```
### Body:
```ts
{
    foodItemId: string, // uuid
    newAmount: number // The new amount of the item. The item will be deleted if the amount is <= 0.
}
```
## Response
### Success:
Message: ```Food item updated```

### Fail:
Message: ```Food item not updated.```

[//]: ############################################################################################################
<br/><br/>