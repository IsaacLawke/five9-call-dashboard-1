const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for user data
const usersSchema = mongoose.Schema({
    _id = mongoose.Schema.Types.ObjectId,
    username: String,
    active: Boolean
});

// Model to store users
const Users = mongoose.model('Users', usersSchema);

// Checks if "username" is an active user in this system
// @param username - User to check
// @ return Boolean - This is an active user
function isActive(username) {

}

// Update from Five9 every ${interval} seconds
// Returns ID for setTimeout timer
async function scheduleUpdate(interval) {

}

module.exports.isActive = isActive;
module.exports.scheduleUpdate = scheduleUpdate;
