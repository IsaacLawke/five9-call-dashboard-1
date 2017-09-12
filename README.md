# Five9 Call Dashboard
Real-time call dashboard using Five9's SOAP APIs, allowing you to groups skills and show current wait times, calls in queue, and agents staffed to handle the calls.

This uses Express as an intermediate server to prevent (unallowed) CORS requests directly to the Five9 API server. There's a bit of server-side translation of JSON to SOAP, as well. VanillaJS and jQuery is used on the client side for rendering.

### Install
Clone the project, go to the new directory and install dependencies:

```
npm install
```

Fire up the server:

```
npm start
```

And travel to `localhost:3000` in your browser. Polyfills haven't been implemented yet, so you'll need a modern browser.

Log in to with your Supervisor-level Five9 credentials, then add a widget and (optionally) put in comma-separated skill names.

Happy queue-watching!
