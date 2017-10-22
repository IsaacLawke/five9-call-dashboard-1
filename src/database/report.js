const mongoose = require('mongoose');

const report = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    zipCode: String,
    calls: { type: Number, default: 0 }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
