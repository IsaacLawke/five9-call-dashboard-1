// General functions to initiate the call map dashboard.
// Uses the CallMap class defined in maps.js to draw the D3 map.

// timeout to pause event loop when needed
let timeout = null;
const mapSettings = {
    display: 'total'
};

$(document).ready(() => {
    let callMap = new CallMap();

    // listen for sign-in and update button presses
    $('.begin-session, .filters-wrapper .update').click(async (event) => {
        // stop any current event loops running
        if (timeout != null) {
            clearTimeout(timeout);
        }
        // Update map every 3 minutes
        startUpdatingMap(callMap, 3*60);
    });

    // Listen for changes to the filter settings
    setupFilterListeners();
});


function setupFilterListeners() {
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

    // Handle selection of Today vs Last X Minutes for relative filters
    $('.relative-date-selector').change(() => {
        if ($('.relative-date-selector').val() == 'last-x-minutes') {
            $('.relative-parameters-wrapper').removeClass('hidden');
        } else {
            $('.relative-parameters-wrapper').addClass('hidden');
        }
    });

    // Alternate between mapping total calls or calls per customer count
    $('.call-display-toggle').children().click((event) => {
        // Was Total button clicked?
        if ($(event.currentTarget).hasClass('total')) {
            mapSettings.display = 'total';
            $('.call-display-toggle .total').addClass('checked');
            $('.call-display-toggle .relative').removeClass('checked');
            // show minimum customer filter
            $('.call-display .minimum-customers-wrapper').addClass('hidden');
        // Relative display was chosen
        } else {
            mapSettings.display = 'relative';
            $('.call-display-toggle .total').removeClass('checked');
            $('.call-display-toggle .relative').addClass('checked');
            $('.call-display .minimum-customers-wrapper').removeClass('hidden');
        }
    });
}

// Begins a loop of updating the map data every ${refreshRate} seconds
async function startUpdatingMap(callMap, refreshRate) {
    try {
        $('.message').text(`Updating...`);
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
    params.skills = $('.skills.filter').val();

    // get all the datas
    let customerData = await getCustomerData();
    const callData = await getReportResults(params, 'maps');


    let data = Object.keys(customerData)
        .map((zip) => ({
            zipCode: zip,
            calls: callData
                    .filter((d) => d.zipCode == zip)
                    .reduce((sum, d) => sum + d.calls, 0),
            customers: customerData[zip]
        }));


    // Determine the field being mapped -- total calls or per customer
    let field;
    if (mapSettings.display == 'total') {
        // rollupFn = (d) => d3.sum(d, (x) => x.calls);
        field = 'calls';
        callMap.keyTitle = 'Calls offered';
        callMap.formatLegend = d3.format('d');
    } else if (mapSettings.display == 'relative') {
        field = 'callsPerCustomer';
        callMap.keyTitle = 'Calls offered divided by customer base';
        callMap.formatLegend = d3.format('.1%');
    }

    // If we're in relative display mode, the user can filter areas meeting a
    // minimum customer count
    let filterFn;
    if (mapSettings.display == 'relative') {
        let minCustomers = $('.minimum-customers').val() * 1;
        filterFn = (d) => d.value.customers >= minCustomers;
    } else {
        filterFn = (d) => true;
    }

    // Key and value extractor functions
    const keyFn = (d) => d.zipCode.substring(0, 3);
    const rollupFn = (d) => {
        let calls = d3.sum(d, (x) => x.calls);
        let customers = d3.sum(d, (x) => x.customers);
        let callsPerCustomer;
        if (customers == 0) callsPerCustomer = 0;
        else callsPerCustomer = calls / customers;
        return {
            'calls': calls,
            'customers': customers,
            'callsPerCustomer': callsPerCustomer
        }
    }

    // Create the data structure in a D3-friendly way
    let callsByZip = d3.nest()
        .key(keyFn)
        .rollup(rollupFn)
        .entries(data)
        .filter(filterFn)
        .filter((d) => d.key != ''); // remove calls with no zipcode assigned

    callMap.update(callsByZip, field, keyFn, rollupFn);

    console.log('Finished updateMap() at ' + moment().format('h:mm:ss A'));
}

// Object to store customer zipcode data.
const customerCount = {
    data: [],
    // record time of last update (default to Y2K to force an update)
    lastUpdated: moment('2000-01-01')
};
/**
 * Retrieve customer counts by zip code. Updates from the server every 6 hours.
 * @return {Object} in format { '<zip code here>': '31415' }
 */
async function getCustomerData() {
    // reload data from server if it's been 6+ hours since the last update
    if (customerCount.lastUpdated.isBefore(moment().subtract(6, 'hours'))) {
        let rawData = await getReportResults({}, 'customers');

        // Convert array of objects to a single object, with zipcode as key
        // and customer count as volue
        customerCount.data = rawData.reduce((object, item) => {
            object[item.zipCode] = item.customerCount;
            return object;
        }, {});

        customerCount.lastUpdated = moment();
    }

    return customerCount.data;
}

// Determines start/end times chosen by user
// Return {start:'X',end:'Y'}
function reportTimeRange() {
    const time = {};
    // Are we using absolute dates?
    if ($('.date-type-toggle .absolute').hasClass('checked')) {
        time.start = moment($('.filter.start-time').val())
                        .tz('America/Los_Angeles')
                        .format('YYYY-MM-DD[T]HH:mm:ss');
        time.end   = moment($('.filter.end-time'  ).val())
                        .tz('America/Los_Angeles')
                        .format('YYYY-MM-DD[T]HH:mm:ss');
    // Using relative dates
    } else {
        const relativeSelector = $('.relative-date-selector').val();
        if (relativeSelector == 'today') {
            time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
            time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';
        // If user specified a certain number of minutes, subtract the minutes,
        // convert to Eastern Time, and round down to nearest 30-minute interval
        } else if (relativeSelector == 'last-x-minutes') {
            const minutes = $('.filter.relative-minutes').val();
            if (isNaN(minutes)) throw new Error(`Relative minute value ${minutes} is not a number.`);
            // Convert to server's timezone
            let start = moment().subtract(minutes, 'm').tz('America/Los_Angeles');
            // round down to nearest interval
            start.subtract(start.minutes() % 30, 'minutes');
            start.seconds(0);
            time.start = start.format('YYYY-MM-DD[T]HH:mm:ss');
            console.log(time.start);
            time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';
        } else {
            throw new Error('Relative date selector value is ' + relativeSelector +
                            '. Value not recognized.');
        }
    }
    return time;
}
