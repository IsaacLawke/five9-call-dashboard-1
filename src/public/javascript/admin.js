// Handles UI interaction for login form

$(document).ready(() => {
    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.admin-panel-wrapper').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        $('.admin-panel-wrapper').removeClass('out-of-the-way');
    });

    // Listen for server reboot request
    $('.reboot-server').click(async (event) => {
        const auth = getAuthString($('.username').val(), $('.password').val());
        const body = { authorization: auth };
        const apiURL = API_URL + 'reboot-server'; // defined in api_url.js

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/text',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        $('.message').text(`Computing....`);

        fetch(apiURL, requestOptions)
            .then(async (response) => {
                let bodyText = await response.text();
                $('.message').text(`Response: ${response.status} ${bodyText}`);
            }).catch((err) => {
                $('.message').text(`Whoops! that got a: ${err}. Server down much?`);
            });
    });


    // Listen for data reload requests
    $('.reload-data').click(async (event) => {
        const auth = getAuthString($('.username').val(), $('.password').val());
        const time = { start: $('.start-time').val(), end: $('.end-time').val() };
        const body = { authorization: auth, time: time };
        const apiURL = API_URL + 'reload-data'; // defined in api_url.js

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/text',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        $('.message').text(`Computing....`);

        fetch(apiURL, requestOptions)
            .then(async (response) => {
                let bodyText = await response.text();
                $('.message').text(`Response: ${response.status} ${bodyText}`);
            }).catch((err) => {
                $('.message').text(`Whoops! ${err}`);
            });
    });
});
