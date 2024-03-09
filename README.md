# Tao Digital Solution Web Scraping Exercise

This repository contains my code for a web scraping exercise, part of the interview process for the remote Web Scraping Engineer position at Tao Digital Solutions. The primary objective of this exercise is to demonstrate my web scraping skills and knowledge. I’ve had to improvise due to some ambiguities in the exercise instructions. Please don’t hesitate to ask any questions about my decisions and implementations.

The service is built using Node.js, Express, Puppeteer, and TypeScript. The application and its API endpoint are deployed and hosted on Azure.

One of the most challenging aspects of this task was circumventing captchas and anti-scraping mechanisms. To minimize detection, I utilized a third-party proxy service provider, ZendRows.

Please note that the code is minimal and does not adhere to many of the best practices that I would typically follow in a production environment. Here’s the basic flow when the `/homes` endpoint receives a request:

1.  Parse the `city` and `state` query parameters.
2.  Launch Puppeteer and navigate directly to `google.com/search?q=`.
3.  Evaluate and gather href links from only the organic results from Google.
4.  Check if `trulia.com` is among the results.
5.  Navigate to the `trulia.com` site.
6.  Perform a search on the Trulia site using `trulia.com/{stateAbbreviation}/{cityName}`.
7.  Use the ZendRows external service to bypass anti-scraping mechanisms.
8.  Navigate from page 1 through 3, and gather home listings (scrolling is flaky).
9.  Merge the results and return them as a JSON response.

## Authors

- [@wonrhee3](https://www.github.com/wonrhee3) Won J. Rhee

## Testing Instructions

- https://tao-scrape.azurewebsites.net/homes?state=TX&city=houston

Only a single endpoint is of value, Simply send a`GET`request with`state`and`city`as query parameters to`/homes` endpoint.

For example,

```
GET https://tao-scrape.azurewebsites.net/homes?state=ca&city=anaheim
```

Postman or simply using browser to the above endpoint should work. It may take up to a minute to respond.

Example JSON response:

```
{
    "source": "trulia.com",
    "results": [
        {
            "price": "$949,000",
            "beds": "3bd",
            "baths": "2ba",
            "address": "2844 W  Rowland Cir, \nAnaheim, CA 92804",
            "link": "https://trulia.com/home/2844-w-rowland-cir-anaheim-ca-92804-25217009"
        },
        {
            "price": "$1,299,000",
            "beds": "5bd",
            "baths": "3ba",
            "address": "9861 Theresa Ave, \nAnaheim, CA 92804",
            "link": "https://trulia.com/home/9861-theresa-ave-anaheim-ca-92804-25219665"
        },
        {
            "price": "$1,189,900",
            "beds": "4bd",
            "baths": "2ba",
            "address": "7880 E  Samantha Cir, \nAnaheim, CA 92807",
            "link": "https://trulia.com/home/7880-e-samantha-cir-anaheim-ca-92807-25398651"
        }
    ]
}
```

## API Reference

#### Hello

```http
  GET /
```

#### Search homes

```http
  GET /homes?city=seattle&state=wa
```

| Query Parameter | Type     | Description                                                   |
| :-------------- | :------- | :------------------------------------------------------------ |
| `city`          | `string` | **Required**. Provide city name to search.                    |
| `state`         | `string` | **Required**. Provide state name to search (e.g. CA, NY, TX). |
