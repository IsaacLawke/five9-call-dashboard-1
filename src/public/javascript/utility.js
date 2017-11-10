
// Send out an error alert in console and on the page.
function error(err, message='Uh oh.') {
    $('#message').text(`Whoops! An error occurred. ${err.message}. ${message}`);
    console.log('Error log:');
    console.error(err);

    // timestamp
    var newDate = new Date();
    newDate.setTime(Date.now());
    dateString = newDate.toTimeString();
    console.log(dateString);
}

// Nicely formatted time
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}


// Combines username and password, then encodes in Base 64. Yum!
function getAuthString(username, password) {
   let auth = username + ':' + password;
   return btoa(auth);
}
