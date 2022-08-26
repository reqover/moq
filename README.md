=== Moq - mocking server without pain

Run

`
docker run -p 3000:3000 \
    -v $PWD/mocks:/tmp/mocks
    reqover/moq
`

`
exports.config = {
    serverUrl: 'https://petstore.swagger.io'
}
`

`
curl --location --request POST 'http://localhost:3000/proxy' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "petstore",
    "url": "https://petstore.swagger.io"
}'
`