## Performance Results
Anything related to performance results is under the endpoint starting with `/index.php?action=result`.
> ### Get Performance Results
```URL```
```http
GET &ids[]
```
```Query Parameters```
- ```ids[]```: Array of datasets IDs related to the performance results

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            id: number,
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
---
> ### Compare 2 Algorithms
```URL```
```http
GET &task=compareAlgorithms&x=...&y=...
```
```Query Parameters```
- ```x```: ID of the algorithm on the X axis
- ```y```: ID of the algorithm on the Y axis

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            datasetId: number,
            x: {
                ndcg: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
                hr: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
                recall: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
            },
            y: {
                ndcg: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
                hr: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
                recall: {
                    one: number,
                    three: number,
                    five: number,
                    ten: number,
                    twenty: number,
                },
            }
        },
        ...
    ],
    metadata: any | null
}
```
---
> ### Get PCA Results
```URL```
```http
GET &task=pcaResults
```

```Response```
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: [
        {
            datasetId: number,
            ndcg: {
                one: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                three: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                five: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                ten: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                twenty: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                }
            },
            hr: {
                one: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                three: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                five: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                ten: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                twenty: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                }
            },
            recall: {
                one: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                three: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                five: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                ten: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                },
                twenty: {
                    x: number | null,
                    y: number | null,
                    varianceX: number | null,
                    varianceY: number | null
                }
            }
        },
        ...
    ],
    metadata: any | null
}
```