# OCR API as a Service using Unkey

This is a OCR API as a Service using Unkey. It uses the [tesseract.js](https://www.npmjs.com/package/tesseract.js) npm package to perform OCR on images.

It uses [Unkey](https://github.com/unkeyed/unkey/) to provision & manage API keys for the service.

## Endpoints

`/signup`: Sign up for an API key. Returns a JSON object with the API key.

It validates the email & provisions & returns an API key. The keys is then used to authenticate the OCR endpoints.

Type: `POST`

Body:
| | | | 
| --- | --- | --- |
| `email` | string | Email address to sign up with |
| `name` | string | Name of user |
| | | | 

Returns:
| | | |
| --- | --- | --- |
| `key` | string | API key |
| `keyId` | string | API key ID |
| | | | 

`/upload`: Upload an image to perform OCR on. Returns a JSON object with the OCR results.

It uses the API key to authenticate the request. It then performs OCR on the image & returns the results.

Type: `POST`

Headers:
| | | |
| --- | --- | --- |
| `Bearer` | string | API key in Bearer auth |
| | | |

Body:
| | | |
| --- | --- | --- |
| `sampleFile` | file | Image file |
| | | |

Returns:
| | | |
| --- | --- | --- |
| `text` | string, null | OCR results |
| `error` | string, null | Error if any |
| | | |

`/uploadBase64`: Upload a base64 encoded image to perform OCR on. Returns a JSON object with the OCR results.

It uses the API key to authenticate the request. It then performs OCR on the image & returns the results.

Type: `POST`

Headers:
| | | |
| --- | --- | --- |
| `Bearer` | string | API key in Bearer auth |
| | | |

Body:
| | | |
| --- | --- | --- |
| `imageBase64` | string | Base64 encoded image |
| | | |

Returns:
| | | |
| --- | --- | --- |
| `text` | string, null | OCR results |
| `error` | string, null | Error if any |
| | | |

## Running locally
1. Clone the repo
2. Run `npm install`. You can use `yarn` or `pnpm` as well.
3. Run `npm run dev` to start the server.

### Environment variables
| Variable | Description |
| --- | --- |
| `PORT` | Port to run the server on. Defaults to `3000` |
| `UNKEY_ROOT_KEY` | Unkey root key |
| `UNKEY_API_ID` | Unkey API ID |


## Understanding Unkey API key authentication

Unkey uses fast & efficient on-the-edge systems to verify a key. The key verification times are as low as 0.1ms

The is provisioned per user in the `/signup` route. The user can then use the key to authenticate requests to the OCR endpoints.

> You can have similar logic in you applications as well.

The user than has to send the API key in the `Authorization` header as a Bearer token. To verify the key, a simple API call is made to Unkey. More on this further ahead.

To verify the key, we've made a middleware in the `middleware.js` file.

### Key Creation

The key is created in the `/signup` route in `index.js`.

It's params are explained in detail in the official [docs](https://docs.unkey.dev/api-reference/keys/create)

Following is a description of params used in this example:
- `apiId`: The API ID to create the key for. You create this API in the Unkey dashboard.

- `prefix`: The prefix to use for the key. Every key is prefixed with this. This is useful to identify the key's purpose. For eg. you can have prefixes like `user_`, `admin_`, `service_`, `staging_`, `trial_`, `production_` etc.

- `byteLength`: The byte length used to generate your key determines its entropy as well as its length. Higher is better, but keys become longer and more annoying to handle.

The default is 16 bytes, or 2^128 possible combinations

- `ownerId`: This can be any string. In this example, we're using the users emai address as the owner ID. By doing this we'll be able to verify the appropriate owner of the key.

- `meta`: Any metadata informatoin you want to store with the key. In this example, we're storing the user's name & email.

- `expires`: You can auto expire keys by providing a unix timestamp in milliseconds. Once keys expire they will automatically be deleted and are no longer valid.

- `rateLimit`: You can ratelimit your key by certain params. This is extremely beneficial as it prevents abuse of your API. The rate limit is enforced on the edge, so it's extremely fast & efficient. The rate limit params we've used in this example are:
    - `type`: Type of the rate limit. Read more [here](https://docs.unkey.dev/features/ratelimiting)
    - `limit`: The number of requests allowed in the given time period
    - `refill`: The number of requests to refill in the given time period
    - `refillInterval`: The intervall by which the requests are refilled

Consider the following example:

Suppose you have an API that allows 100 requests per minute. You can set the following rate limit:
- `type`: `fast` or `consistent`
- `limit`: `100` // 100 requests per minute
- `refill`: `100` // Refill 100 requests per minute
- `refillInterval`: `60000` // Refill every minute


### Key verification

The key verification is done in the `middleware.js` file. We're making an API call to the Unkey API to verify the key.by passing the `key` in the request body.

#### Key verification response

Let's understand the response we get from the Unkey API when we verify a key.

```json
{
    "valid": true,
    "ownerId": "john@example.com",
    "meta": {
        "email": "john@example.com",
        "name": "John Doe"
    },
    "expires": 1696870038000,
    "ratelimit": {
        "limit": 1,
        "remaining": 0,
        "reset": 1690350175693
    }
}
```

Let's understand the response in detail:
- `expires`: The unix timestamp in milliseconds when the key expires. You can return this to the user or if the time of expiry is near, you can ask/alert the user to renew the key.
- `ratelimit`: Currently the user is limited to 1 request per minute. The `limit` param tells us how many more the requests the user has left. The `reset` tells us the time when the requests will be refilled. You can use this to show the user how much time is left before they can make another request.

> You can have similar logic in you applications as well.