# Five9 Call Dashboard
Real-time call dashboard using Five9's SOAP APIs, allowing you to groups skills and show current wait times, calls in queue, and agents staffed to handle the calls. The maps page is a [choropleth](https://bl.ocks.org/mbostock/4060606 "example of a choropleth") showing calls by ZIP3 code with [D3](https://d3js.org/ "D3").

This uses Express as an intermediate server to circumvent browser-side CORS requests directly to the Five9 API server. There's a bit of server-side translation of JSON to SOAP, as well. VanillaJS and jQuery are used on the client side for updating the view.

### Install
Clone the project, go to the new directory and install dependencies:

```
npm install
```

Fire up the server:

```
npm start
```

Create a file `src/public/javascript/local_settings.js` that looks like this:

```
// Express API URL - development setting
const API_URL = 'http://localhost:3000/api/';

// Name of Five9 field that provides callers' zip codes for the map functionality
const FIVE9_ZIP_FIELD = 'CallersZipCodeForExample';
```

For SL and zipcode data, create a file `src/secure_settings.js`:

```
const FIVE9_USERNAME = 'admin_username';
const FIVE9_PASSWORD = 'admin_password';

// MongoDB URI
const MONGODB_URI = 'mongodb://localhost/five9-report-data-collection';

// ...then export these constants
```

Then travel to `localhost:3000` in your browser. Polyfills haven't been implemented yet, so you'll need a modern browser.

Type in your Supervisor-level Five9 credentials, then add a widget and (optionally) put in comma-separated skill names.

Happy queue-watching!
