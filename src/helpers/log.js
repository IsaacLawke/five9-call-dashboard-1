// Utility functions for logging and recording updates
function message(text) {
    console.log(text);
}

function error(text) {
    console.log(text);
}

module.exports.message = message;
module.exports.error = error;
