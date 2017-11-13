const five9 = require('../helpers/five9-interface');
const log = require('../helpers/log');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for user data
const usersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    active: Boolean
});

// Model to store users
const Users = mongoose.model('Users', usersSchema);

// Checks if "username" is an active user in this system.
// Async, as this function will wait for User database updates to complete
// before sending a response (if database is in the middle of an update).
// @param username - User to check
// @return Boolean - This is an active user
async function isActive(username) {
    function wait(t) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, t);
        });
    }
    let waited = 0;
    while (currentlyUpdatingData && waited < 30000) {
        log.message(`Users.isActive called while database is updating; waiting 1000ms`);
        waited += 1000;
        await wait(1000);
    }
    let user = await Users.findOne({ username: username });
    return user != null && user.active;
}

// Update from Five9 every ${interval} seconds
// Returns ID for setTimeout timer
let currentlyUpdatingData = false;
async function scheduleUpdate(interval) {
    currentlyUpdatingData = true;
    log.message(`Updating users database`);
    await refreshUserDatabase(Users);

    currentlyUpdatingData = false;
    return setTimeout(() => scheduleUpdate(interval), interval);
}

async function refreshUserDatabase(usersModel) {
    let data = await five9.getUsersGeneralInfo();

    // Clear the old list
    await usersModel.remove({}, (err, success) => {
        if (err) log.error(`Error deleting data in Users model: ${err}`);
    });

    // Only leave the `username` and `active` fields
    let cleanData = data.map((d, i) => {
        return { username: d.userName,
                 active: d.active == 'true' ? true : false
        };
    });

    return usersModel.collection.insert(cleanData, (err, docs) => {
        if (err) log.error(`Error inserting data in Users model: ${err}`);
    });
}

module.exports.isActive = isActive;
module.exports.scheduleUpdate = scheduleUpdate;
module.exports.refreshUserDatabase = refreshUserDatabase;
