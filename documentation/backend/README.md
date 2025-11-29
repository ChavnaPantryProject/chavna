# Backend REST API Documentation
All request bodies are passed in the JSON format.

# Standard Response
Every single request will respond with the same basic response. Do not assume a request can't fail because there is no failure response documented. I've only documented the ones that you should expect to see. If you see something else let me (Brian) know.
```ts
{
  success: 'success' | 'fail' | 'error', // Currently errors still return 'fail'. Expect this to be changed in the future.
  status: int, // status code (200 unless otherwise specified)
  message?: string,
  payload?: object // JSON object containng response payload
}
```