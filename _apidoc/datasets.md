## Datasets

Anything related to datasets is under the endpoint starting with `/index.php?action=dataset`.
> ### Get all datasets
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
            meanNumberOfRatingsOnItem: number | null
        },
        ...
    ],
    metadata: any | null
}
```

---
> ### Get a dataset
```URL```
```http
GET ?id=...
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