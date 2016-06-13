# Website to pdf scragarator

## Install and ignite

Clone the repo

Install the submodules
```
git submodule init
git submodule update
```

Start your engines
```
npm start
```

## Demo

[https://website-to-pdf.herokuapp.com/pdf?url=https://news.ycombinator.com](https://website-to-pdf.herokuapp.com/pdf?url=https://news.ycombinator.com)

## Usage

To scrape a page, generate a pdf and download it, send a request to the API, with the url as query param. As an example, simply visit the url below:

[http://localhost:3000/pdf?url=https://news.ycombinator.com](http://localhost:3000/pdf?url=https://news.ycombinator.com)

## Options

The options can be used through query parameters. The microservice exposes all of the options for GET requests. Support for headers can be added.

* url – the url to parse
* cookie – a stringified JSON of a cookie, used e.g. for authentication
* title – the requested pdf filename, a timestamp will be added to the end of it
* conode – a conditional HTML node id to wait for, otherwise a timeout is set, to let the front-end app to render
* viewer – open the pdf in Mozilla pdf.js viewer instead

[https://website-to-pdf.herokuapp.com/pdf?url=https://news.ycombinator.com](https://website-to-pdf.herokuapp.com/pdf?url=https://news.ycombinator.com&title=reddit)

## Deployment

There is a Procfile added for heroku deployment, and also a Dockerfile, which can be used to prepare a Docker image and run the microservice like that.

Please set the environment variable PDFHOST to your `<hostname>:<port>`, e.g. `localhost:3000` or just `cooldomain.com`
