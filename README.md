=== Moq - mocking server without pain

Run

`
docker run -p 3000:3000 \
    -v $PWD/mocks:/usr/src/app/mocks
    reqover/moq
`

`
exports.config = {
    serverUrl: 'https://petstore.swagger.io'
}
`