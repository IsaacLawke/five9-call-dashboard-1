# Five9 Call Dashboard
Real-time call dashboard using Five9's SOAP APIs, allowing you to groups skills and show current wait times, service levels, calls in queue, and agents staffed to handle the calls. Also included is a maps page showing calls by ZIP3 code using [D3](https://d3js.org/ "D3") to create a [choropleth](https://bl.ocks.org/mbostock/4060606 "example of a choropleth").

This uses Express as an intermediate server to get Five9 data and store it in MongoDB, then pass it along to the client. VanillaJS and jQuery are used on the client side for updating the view.

### Install
Clone the project, go to the new directory and install dependencies:

```
npm install
```

Create a file `src/public/javascript/local_settings.js` defining our API URL:

```
// Express API URL - development setting
const API_URL = 'http://localhost:3000/api/';
```

For data retrieval from Five9, create a file `src/secure_settings.js`:

```
// Admin- and supervisor-level credentials to retrieve report and queue data
module.exports.FIVE9_USERNAME = 'admin_username';
module.exports.FIVE9_PASSWORD = 'admin_password';

// Insert MongoDB URI here
module.exports.MONGODB_URI = 'mongodb://localhost/five9-report-data-collection';
```

Fire up the server:

```
npm start
```

Then travel to `localhost:3000` in your browser. Polyfills haven't been implemented yet, so you'll need a modern browser.

Type in your Supervisor-level Five9 credentials, then add a widget and (optionally) put in comma-separated skill names.

Happy queue-watching!

### Code structure
All client-side files (HTML, JS, and CSS) are in the `src/public` directory.

The Express server is defined in `src/app.js`, including routes and spinning up the repeating calls to Five9's API. The data from Five9 is stored in the local MongoDB database.

Client requests to the API hit the Express server, which pulls the appropriate data from MongoDB and passes it on to the client.
