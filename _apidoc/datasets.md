## Datasets
> ### Get all datasets' IDs and names
```URL```
```http
GET /datasets.php
```
```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            id: number,
            name: string,
            numberOfUsers: number | null,
            numberOfItems: number | null,
            numberOfInteractions: number | null,
            userItemRatio: number | null,
            itemUserRatio: number | null,
            density: number | null,
            feedbackType: string | null,
            highestNumberOfRatingBySingleUser: number | null,
            lowestNumberOfRatingBySingleUser: number | null,
            highestNumberOfRatingOnSingleItem: number | null,
            lowestNumberOfRatingOnSingleItem: number | null,
            meanNumberOfRatingsByUser: number | null,
            meanNumberOfRationsOnItem: number | null
        },
        ...
    ],
    metadata: any | null
}
```

---
> ### Get a dataset's ID and name
```URL```
```http
GET /dataset.php?id=...
```
```Query Parameters```
- ```id```: ID of the dataset to retreive

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: {
        id: number,
        name: string,
        numberOfUsers: number | null,
        numberOfItems: number | null,
        numberOfInteractions: number | null,
        userItemRatio: number | null,
        itemUserRatio: number | null,
        density: number | null,
        feedbackType: string | null,
        highestNumberOfRatingBySingleUser: number | null,
        lowestNumberOfRatingBySingleUser: number | null,
        highestNumberOfRatingOnSingleItem: number | null,
        lowestNumberOfRatingOnSingleItem: number | null,
        meanNumberOfRatingsByUser: number | null,
        meanNumberOfRationsOnItem: number | null
    },
    metadata: any | null
}
```