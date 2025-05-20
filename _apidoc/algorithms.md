## Algorithms
Anything related to algorithms is under the endpoint starting with `/index.php?action=algorithm`.
> ### Get all algorithms
```URL```
```http
GET /
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
> ### Get an algorithm
```URL```
```http
GET ?id=...
```
```Query Parameters```
- ```id```: ID of the algorithm to fetch

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