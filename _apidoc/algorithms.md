## Algorithms
> ### Get all algorithms' IDs and names
```URL```
```http
GET /algorithms.php
```
```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            id: number,
            name: string
        },
        ...
    ],
    metadata: any | null
}
```
---
> ### Get an algorithm's ID and name
```URL```
```http
GET /algorithm.php?id=...
```
```Query Parameters```
- ```id```: ID of the algorithm to retreive

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: {
        id: number,
        name: string
    },
    metadata: any | null
}
```