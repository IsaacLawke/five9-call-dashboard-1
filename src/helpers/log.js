const moment = require('moment');

// Utility functions for logging and recording updates
function message(text) {
    console.log(`[${moment()}] ${text}`);
}

function error(text) {
    console.error(`[${moment()}] ${text}`);
}

module.exports.message = message;
module.exports.error = error;
