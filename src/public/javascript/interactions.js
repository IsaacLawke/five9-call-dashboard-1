// Handles UI interaction for login form

$(document).ready(() => {
    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.credentials-form').removeClass('out-of-the-way');
        $('.credentials-cover').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        // prevent redirection
        event.preventDefault();
        
        // clear Five9 credentials box and update Login button text
        $('.credentials-form').addClass('out-of-the-way');
        $('.credentials-cover').removeClass('out-of-the-way');
        $('.credentials-cover-toggle').text('Logged In');
    });
});
