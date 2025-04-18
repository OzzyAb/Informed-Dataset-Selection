## Performance Results
Anything related to performance results is under the endpoint starting with `/index.php?action=result`.
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