**Moq - mocking server without pain**

Run

```
docker run -p 3000:3000 \
    -v $PWD/mocks:/tmp/mocks
    reqover/moq
```

confg.json
```
{
    serverUrl: 'https://petstore.swagger.io'
}
```

Status endpoint:

```
/status
```

```
curl --location --request POST 'http://localhost:3000/proxy' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "petstore",
    "url": "https://petstore.swagger.io"
}'
```
