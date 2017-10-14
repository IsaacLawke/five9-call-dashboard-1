const https = require('https');
const xml = require('xml');


// Takes a JSON object specifying a Five9 API endpoint,
// and returns a SOAP message to send to the Five9 API.
function jsonToSOAP(json, adminOrSupervisor='admin') {
    const service = json['service'];
    const settings = xml(json['settings']);
    const soapString =
        `<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.${adminOrSupervisor}.ws.five9.com/">
            <x:Header/>
            <x:Body>
                <ser:${service}>
                    ${settings}
                </ser:${service}>
            </x:Body>
        </x:Envelope>`;
    return soapString;
}


// Create a request to the Five9 Statistics API.
// Returns promise.
function statsRequest(message, auth) {    // Generate SOAP message for Five9
    // Options for HTTP requests
    const options = {
        hostname: 'api.five9.com',
        path: '/wssupervisor/v9_5/SupervisorWebService',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'text/xml;charset=UTF-8',
            'Content-Length': Buffer.byteLength(message),
            'SOAPAction': ''
        }
    };

    // Wrap in promise
    return new Promise((resolve, reject) => {
        var req = https.request(options, (res) => {
            // console.log('\n---------------------------------------');
            // console.log('---- Status:', res.statusCode, res.statusMessage);
            // console.log('---- Headers:', res.headers);

            var data = [];
            res.on('data', (d) => {
                data.push(d);
            });
            res.on('end', () => {
                var dataString = data.join('');
                resolve(dataString);
            });
        });

        // Send the data
        req.write(message);

        req.on('error', (e) => {
            console.error(e);
            reject(e);
        });
    });
}


// Create a request to the Five9 Configuration API.
// Returns promise.
function configRequest(message, auth) {    // Generate SOAP message for Five9
    // Options for HTTP requests
    const options = {
        hostname: 'api.five9.com',
        path: '/wsadmin/v9_5/AdminWebService',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'text/xml;charset=UTF-8',
            'Content-Length': Buffer.byteLength(message),
            'SOAPAction': ''
        }
    };

    // Wrap in promise
    return new Promise((resolve, reject) => {
        var req = https.request(options, (res) => {
            // console.log('\n---------------------------------------');
            // console.log('---- Status:', res.statusCode, res.statusMessage);
            // console.log('---- Headers:', res.headers);

            var data = [];
            res.on('data', (d) => {
                data.push(d);
            });
            res.on('end', () => {
                var dataString = data.join('');
                resolve(dataString);
            });
        });

        // Send the data
        req.write(message);

        req.on('error', (e) => {
            console.error(e);
            reject(e);
        });
    });
}


// Get a given statistic's column of data
function getStatistic(statisticType, columnName) {
    let columnString = '';
    if (columnName != null) {
        columnString =
            `<columnNames>
                <values>
                    <data>${columnName}</data>
                </values>
            </columnNames>`;
    }

    const message =
        `<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.supervisor.ws.five9.com/">
        <x:Header/>
            <x:Body>
                <ser:getStatistics>
                    <statisticType>${statisticType}</statisticType>
                    ${columnString}
                </ser:getStatistics>
            </x:Body>
        </x:Envelope>`;

    return statsRequest(message);
}


// Create a request to the Five9 Statistics API.
// Returns promise.
function configRequest(message, auth) {
    // Options for HTTP requests
    const options = {
        hostname: 'api.five9.com',
        path: '/wsadmin/v9_5/AdminWebService',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'text/xml;charset=UTF-8',
            'Content-Length': Buffer.byteLength(message),
            'SOAPAction': ''
        }
    };

    // Wrap in promise
    return new Promise((resolve, reject) => {
        var req = https.request(options, (res) => {
            console.log('\n---------------------------------------');
            console.log('---- Status:', res.statusCode, res.statusMessage);
            console.log('---- Headers:', res.headers);

            var data = [];
            res.on('data', (d) => {
                data.push(d);
            });
            res.on('end', () => {
                var dataString = data.join('');
                resolve(dataString);
            });
        });

        // Send the data
        req.write(message);

        req.on('error', (e) => {
            console.error(e);
            reject(e);
        });
    });
}


module.exports.jsonToSOAP = jsonToSOAP;
module.exports.statsRequest = statsRequest;
module.exports.configRequest = configRequest;
