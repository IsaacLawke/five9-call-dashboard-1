// General functions to initiate the call map dashboard.
// Uses the CallMap class defined in maps.js to draw the D3 map.

// timeout to pause event loop when needed
let timeout = null;


$(document).ready(() => {
    let callMap = new CallMap();

    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.credentials-form').removeClass('out-of-the-way');
        $('.credentials-cover').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        // prevent redirection
        event.preventDefault();
        // stop any current event loops running
        if (timeout != null) {
            clearTimeout(timeout);
        }

        // clear Five9 credentials box and update Login button text
        $('.credentials-form').addClass('out-of-the-way');
        $('.credentials-cover').removeClass('out-of-the-way');
        $('.credentials-cover-toggle').text('Logged In');

        // await beginSession();
        await updateMap(callMap);
        console.log('finished updateMap()!');
    });
});


// Update callMap (d3 map object) based on parameters in page
async function updateMap(callMap) {
    const startTime = $('.filter.start-time').val();
    const endTime = $('.filter.end-time').val();

    const params = getParameters('runReport', null, startTime, endTime);
    const csvData = await getReportResults(params);

    const data = d3.csvParse(csvData);
    data.forEach((d) => {
        d.CALLS = +d.CALLS;
    });

    callMap.update(data);
}
