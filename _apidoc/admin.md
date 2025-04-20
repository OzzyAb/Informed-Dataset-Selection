## Performance Results
This endpoint is used for admin operations. The endpoint starts with `/index.php?action=admin`.
> ### Add New Performance Results w/ Algorithms and Datasets
This endpoint will add new performance results to the database. If the algoritms and datasets in the results do not exist already in the database, they are also added automatically.

```URL```
```http
GET &task=addResults
```
```Headers```
```js
{
    (Admin header here): (Admin secret key here)
}
```

```Request Body```
```js
{
    results: [
        {
            algorithmName: string,
            datasetName: string,
            fold: number,
            algorithmConfigIndex: number,
            algorithmConfiguration: string,
            numberOfUsers: number | null,
            numberOfItems: number | null,
            numberOfInteractions: number | null,
            userItemRatio: number | null,
            itemUserRatio: number | null,
            density: number | null,
            feedbackType: string | null,
            highestNumberOfRatingBySingleUser: number | null,
            LowestNumberOfRatingBySingleUser: number | null,
            highestNumberOfRatingOnSingleItem: number | null,
            lowestNumberOfRatingOnSingleItem: number | null,
            meanNumberOfRatingsByUser: number | null,
            meanNumberOfRatingsOnItem: number | null,
            ndcg: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null,
            } | null,
            hr: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null,
            } | null,
            recall: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null,
            } | null,
        },
        ...
    ]
}
```
```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: {
        createdAlgorithms: string[],
        createdDatasets: string[]
    },
    metadata: any | null
}
```

> ### Get Performance Results
```URL```
```http
GET &task=getResults
```
```Headers```
```js
{
    (Admin header here): (Admin secret key here)
}
```

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            id: number,
            fold: number,
            algorithmConfigIndex: number,
            algorithmConfiguration: string,
            algorithmId: number,
            datasetId: number,
            createdDate: string,
            hr: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null
            },
            ndcg: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null
            },
            recall: {
                one: number | null,
                three: number | null,
                five: number | null,
                ten: number | null,
                twenty: number | null
            }
        },
    ],
    metadata: any | null
}
```