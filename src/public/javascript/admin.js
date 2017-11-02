// Handles UI interaction for login form

$(document).ready(() => {
    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.main-wrapper').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        $('.main-wrapper').removeClass('out-of-the-way');
    });
});
