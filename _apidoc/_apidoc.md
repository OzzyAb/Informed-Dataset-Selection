# Datasets Recommender Systems API Documentation

## Base URL
The base URL for all requests is: `https://datasets.recommender-systems.com`

## Response Structure
Every HTTP request to the backend will return in one of these specified formats.
- ```Success```: if the response returns with a status code of ```2xx``` and no body
```js
{
    statusCode: number,
    isSuccess: true,
    metadata: any | null
}
```
- ```Payload```: if the response returns with a status code of ```2xx``` and a body
```js
{
    statusCode: number,
    isSuccess: true,
    data: any | null,
    metadata: any | null
}
```
- ```Fail```: if the response returns with a status code of either ```4xx``` or ```5xx```
```js
{
    statusCode: number,
    isSuccess: false,
    message: string | null,
    metadata: any | null
}
```
In general, the response can be expected in this this format:
```js
{
    statusCode: number,
    isSuccess: boolean,
    data: any | null,
    message: string | null,
    metadata: any | null
}
```
If the backend returns any other response format rather than the defined ones above, it means an unhandled error happened in the backend. In this case, the request's response can be interpreted as ```500 Internal Server Error```.
