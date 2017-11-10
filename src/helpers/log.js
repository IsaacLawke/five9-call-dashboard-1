const moment = require('moment');

// Utility functions for logging and recording updates
function message(text) {
    console.log(`${text} at ${moment()}`);
}

function error(text) {
    console.error(`${text} at ${moment()}`);
}

module.exports.message = message;
module.exports.error = error;
