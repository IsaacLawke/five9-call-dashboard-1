// General functions to initiate the call map dashboard.
// Uses the CallMap class defined in maps.js to draw the D3 map.

// timeout to pause event loop when needed
let timeout = null;

$(document).ready(() => {
    let callMap = new CallMap();

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        // stop any current event loops running
        if (timeout != null) {
            clearTimeout(timeout);
        }

        // Update map every 3 minutes
        startUpdatingMap(callMap, 3*60);
    });

    // handle toggle for relative / absolute date filters
    $('.date-type-toggle').children().click((event) => {
        // Relative button was chosen
        if ($(event.currentTarget).hasClass('relative')) {
            // Update toggle buttons to show current selection
            $('.date-type-toggle .relative').addClass('checked');
            $('.date-type-toggle .absolute').removeClass('checked');
            // Display the appropriate date selection
            $('.date-filter-inputs.absolute').addClass('hidden');
            $('.date-filter-inputs.relative').removeClass('hidden');
        // Absolute button was clicked
        } else {
            $('.date-type-toggle .absolute').addClass('checked');
            $('.date-type-toggle .relative').removeClass('checked');
            $('.date-filter-inputs.relative').addClass('hidden');
            $('.date-filter-inputs.absolute').removeClass('hidden');
        }
    })
});


// Begins a loop of updating the map data every ${refreshRate} seconds
async function startUpdatingMap(callMap, refreshRate) {
    try {
        await updateMap(callMap);
        $('.message').text('Last updated ' + moment().format('h:mm:ss A') + '.');
    } catch (err) {
        error(err);
    }
    timeout = setTimeout(() => startUpdatingMap(callMap, refreshRate),
                         refreshRate * 1000);
}

// Update callMap (d3 map object) based on parameters in page
async function updateMap(callMap) {
    const params = reportTimeRange();
    params.skills = 'TS,TECH';

    const data = await getReportResults(params, 'maps');
    console.log(data);
    callMap.update(data);

    console.log('Finished updateMap() at ' + moment().format('h:mm:ss A'));
}

// Determines start/end times chosen by user
// Return {start:'X',end:'Y'}
function reportTimeRange() {
    const time = {};
    // Are we using absolute dates?
    if ($('.date-type-toggle .absolute').hasClass('checked')) {
        time.start = $('.filter.start-time').val();
        time.end   = $('.filter.end-time').val();
    // Using relative dates
    } else {
        const relativeSelector = $('.relative-date-selector').val();
        if (relativeSelector == 'today') {
            time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
            time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';
        } else {
            throw new Error('Relative date selector value is ' + relativeSelector +
                            '. Value not recognized.');
        }
    }
    return time;
}
