/*
** Helper to authenticate users before returning data to them.
**
**
**
*/

const five9 = require('../helpers/five9-interface');
const log = require('../helpers/log');
const users = require('./users');


// See if user is authorized before pulling reports.
// Returns true if user has permissions; otherwise false.
// ${auth} should be base64 encoded 'username:password' string
async function hasPermission(auth) {
    // Log this username
    const decoded = Buffer.from(auth, 'base64').toString();
    const username = decoded.split(':')[0];

    // Is this an active user in our Five9 instance? If not, no go.
    let activeUser = await users.isActive(username);
    if (!activeUser) {
        log.error(`User ${username} not found in database as active user`);
        return false;
    }

    // Create a statistics request with these credentials
    const params = { 'service': 'getMyPermissions' };
    const requestMessage = five9.jsonToSOAP(params, 'statistics');
    let response = await five9.sendRequest(requestMessage, auth, 'statistics');

    // If server responded with success, we're good
    if (response.statusCode == 200) {
        return true;
    }
    // If Five9 server was able to authenticate user but the user just doesn't
    // have a session open, they're good.
    if (response.statusCode == 500 && response.body.search('Session was closed') > -1) {
        return true;
    }
    // Otherwise, you shall not pass!
    log.error(`User ${username} not authenticated successfully`);
    return false;
}

// See if agent is authorized through Agent API
async function hasAgentPermission(auth) {
    // Break out username and password for HTTP request
    const decoded = Buffer.from(auth, 'base64').toString();
    const [username, password] = decoded.split(':');

    
}

module.exports.hasPermission = hasPermission;
module.exports.hasAgentPermission = hasAgentPermission;
