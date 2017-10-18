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
function sendRequest(message, auth, requestType) {
    let path;
    if (requestType == 'statistics') {
        path = '/wssupervisor/v9_5/SupervisorWebService';
    } else if (requestType == 'configuration') {
        path = '/wsadmin/v9_5/AdminWebService';
    }

    // Options for HTTP requests
    const options = {
        hostname: 'api.five9.com',
        path: path,
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
module.exports.sendRequest = sendRequest;;
