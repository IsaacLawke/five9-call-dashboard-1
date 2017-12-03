

let x = [{"Date": "2017-11-01","AHT": "12:25","ACW": "12:35","Hold": "12:31","Calls": "62"}, {"Date": "2017-11-02","AHT": "12:51","ACW": "12:23","Hold": "12:35","Calls": "68"}, {"Date": "2017-11-03","AHT": "12:29","ACW": "12:25","Hold": "12:38","Calls": "42"}, {"Date": "2017-11-04","AHT": "12:42","ACW": "12:46","Hold": "12:31","Calls": "62"}, {"Date": "2017-11-05","AHT": "12:16","ACW": "12:23","Hold": "12:16","Calls": "53"}, {"Date": "2017-11-06","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-07","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-08","AHT": "12:24","ACW": "12:25","Hold": "12:20","Calls": "54"}, {"Date": "2017-11-09","AHT": "12:35","ACW": "12:24","Hold": "12:18","Calls": "28"}, {"Date": "2017-11-10","AHT": "12:22","ACW": "12:33","Hold": "12:30","Calls": "45"}, {"Date": "2017-11-11","AHT": "12:04","ACW": "12:40","Hold": "12:26","Calls": "30"}, {"Date": "2017-11-12","AHT": "12:59","ACW": "12:46","Hold": "12:46","Calls": "41"}, {"Date": "2017-11-13","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-14","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-15","AHT": "12:28","ACW": "12:25","Hold": "12:39","Calls": "41"}, {"Date": "2017-11-16","AHT": "12:34","ACW": "12:37","Hold": "12:29","Calls": "51"}, {"Date": "2017-11-17","AHT": "12:17","ACW": "12:23","Hold": "12:21","Calls": "41"}, {"Date": "2017-11-18","AHT": "12:44","ACW": "12:45","Hold": "12:24","Calls": "35"}, {"Date": "2017-11-19","AHT": "12:00","ACW": "12:25","Hold": "12:25","Calls": "25"}, {"Date": "2017-11-20","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-21","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-22","AHT": "12:30","ACW": "12:44","Hold": "12:20","Calls": "43"}, {"Date": "2017-11-23","AHT": "12:16","ACW": "12:26","Hold": "12:16","Calls": "51"}, {"Date": "2017-11-24","AHT": "12:21","ACW": "12:25","Hold": "12:45","Calls": "46"}, {"Date": "2017-11-25","AHT": "12:20","ACW": "12:47","Hold": "12:37","Calls": "43"}, {"Date": "2017-11-26","AHT": "12:37","ACW": "12:35","Hold": "12:18","Calls": "41"}, {"Date": "2017-11-27","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-28","AHT": "N/A","ACW": "N/A","Hold": "N/A","Calls": "0"}, {"Date": "2017-11-29","AHT": "12:38","ACW": "12:35","Hold": "12:29","Calls": "42"}, {"Date": "2017-11-30","AHT": "12:56","ACW": "12:28","Hold": "12:22","Calls": "55"}]


let prodData = [{"Date": "2017-11-01","Productivity": "0.86"}, {"Date": "2017-11-02","Productivity": "0.86"}, {"Date": "2017-11-03","Productivity": "0.86"}, {"Date": "2017-11-04","Productivity": "0.92"}, {"Date": "2017-11-05","Productivity": "0.84"}, {"Date": "2017-11-06","Productivity": "N/A"}, {"Date": "2017-11-07","Productivity": "N/A"}, {"Date": "2017-11-08","Productivity": "0.86"}, {"Date": "2017-11-09","Productivity": "0.93"}, {"Date": "2017-11-10","Productivity": "0.93"}, {"Date": "2017-11-11","Productivity": "0.87"}, {"Date": "2017-11-12","Productivity": "0.86"}, {"Date": "2017-11-13","Productivity": "N/A"}, {"Date": "2017-11-14","Productivity": "N/A"}, {"Date": "2017-11-15","Productivity": "0.86"}, {"Date": "2017-11-16","Productivity": "0.84"}, {"Date": "2017-11-17","Productivity": "0.93"}, {"Date": "2017-11-18","Productivity": "0.92"}, {"Date": "2017-11-19","Productivity": "0.84"}, {"Date": "2017-11-20","Productivity": "N/A"}, {"Date": "2017-11-21","Productivity": "N/A"}, {"Date": "2017-11-22","Productivity": "0.86"}, {"Date": "2017-11-23","Productivity": "0.79"}, {"Date": "2017-11-24","Productivity": "0.88"}, {"Date": "2017-11-25","Productivity": "0.90"}, {"Date": "2017-11-26","Productivity": "0.80"}, {"Date": "2017-11-27","Productivity": "N/A"}, {"Date": "2017-11-28","Productivity": "N/A"}, {"Date": "2017-11-29","Productivity": "0.83"}, {"Date": "2017-11-30","Productivity": "0.83"}]


let dtvData = [{"Date": "2017-11-01","DTV Sales": "2","Rolling Total": "2","Pacing": "1.36","Delta": "1"}, {"Date": "2017-11-02","DTV Sales": "0","Rolling Total": "2","Pacing": "2.73","Delta": "-1"}, {"Date": "2017-11-03","DTV Sales": "1","Rolling Total": "3","Pacing": "4.09","Delta": "-1"}, {"Date": "2017-11-04","DTV Sales": "4","Rolling Total": "7","Pacing": "5.45","Delta": "2"}, {"Date": "2017-11-05","DTV Sales": "4","Rolling Total": "11","Pacing": "6.82","Delta": "4"}, {"Date": "2017-11-06","DTV Sales": "N/A","Rolling Total": "11","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-07","DTV Sales": "N/A","Rolling Total": "11","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-08","DTV Sales": "3","Rolling Total": "14","Pacing": "8.18","Delta": "6"}, {"Date": "2017-11-09","DTV Sales": "3","Rolling Total": "17","Pacing": "9.55","Delta": "7"}, {"Date": "2017-11-10","DTV Sales": "0","Rolling Total": "17","Pacing": "10.91","Delta": "6"}, {"Date": "2017-11-11","DTV Sales": "4","Rolling Total": "21","Pacing": "12.27","Delta": "9"}, {"Date": "2017-11-12","DTV Sales": "0","Rolling Total": "21","Pacing": "13.64","Delta": "7"}, {"Date": "2017-11-13","DTV Sales": "N/A","Rolling Total": "21","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-14","DTV Sales": "N/A","Rolling Total": "21","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-15","DTV Sales": "2","Rolling Total": "23","Pacing": "15","Delta": "8"}, {"Date": "2017-11-16","DTV Sales": "4","Rolling Total": "27","Pacing": "16.36","Delta": "11"}, {"Date": "2017-11-17","DTV Sales": "0","Rolling Total": "27","Pacing": "17.73","Delta": "9"}, {"Date": "2017-11-18","DTV Sales": "0","Rolling Total": "27","Pacing": "19.09","Delta": "8"}, {"Date": "2017-11-19","DTV Sales": "1","Rolling Total": "28","Pacing": "20.45","Delta": "8"}, {"Date": "2017-11-20","DTV Sales": "N/A","Rolling Total": "28","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-21","DTV Sales": "N/A","Rolling Total": "28","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-22","DTV Sales": "0","Rolling Total": "28","Pacing": "21.82","Delta": "6"}, {"Date": "2017-11-23","DTV Sales": "3","Rolling Total": "31","Pacing": "23.18","Delta": "8"}, {"Date": "2017-11-24","DTV Sales": "0","Rolling Total": "31","Pacing": "24.55","Delta": "6"}, {"Date": "2017-11-25","DTV Sales": "4","Rolling Total": "35","Pacing": "25.91","Delta": "9"}, {"Date": "2017-11-26","DTV Sales": "2","Rolling Total": "37","Pacing": "27.27","Delta": "10"}, {"Date": "2017-11-27","DTV Sales": "N/A","Rolling Total": "37","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-28","DTV Sales": "N/A","Rolling Total": "37","Pacing": "N/A","Delta": "N/A"}, {"Date": "2017-11-29","DTV Sales": "2","Rolling Total": "39","Pacing": "28.64","Delta": "10"}, {"Date": "2017-11-30","DTV Sales": "2","Rolling Total": "41","Pacing": "30","Delta": "11"}]


let closeRateData = [{"Date": "2017-11-01","Close Rate": "0.39","Sales": "24","Calls": "62"}, {"Date": "2017-11-02","Close Rate": "0.37","Sales": "25","Calls": "68"}, {"Date": "2017-11-03","Close Rate": "0.40","Sales": "17","Calls": "42"}, {"Date": "2017-11-04","Close Rate": "0.40","Sales": "25","Calls": "62"}, {"Date": "2017-11-05","Close Rate": "0.37","Sales": "20","Calls": "53"}, {"Date": "2017-11-06","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-07","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-08","Close Rate": "0.44","Sales": "24","Calls": "54"}, {"Date": "2017-11-09","Close Rate": "0.58","Sales": "16","Calls": "28"}, {"Date": "2017-11-10","Close Rate": "0.44","Sales": "20","Calls": "45"}, {"Date": "2017-11-11","Close Rate": "0.57","Sales": "17","Calls": "30"}, {"Date": "2017-11-12","Close Rate": "0.41","Sales": "17","Calls": "41"}, {"Date": "2017-11-13","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-14","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-15","Close Rate": "0.56","Sales": "23","Calls": "41"}, {"Date": "2017-11-16","Close Rate": "0.35","Sales": "18","Calls": "51"}, {"Date": "2017-11-17","Close Rate": "0.41","Sales": "17","Calls": "41"}, {"Date": "2017-11-18","Close Rate": "0.58","Sales": "20","Calls": "35"}, {"Date": "2017-11-19","Close Rate": "0.59","Sales": "15","Calls": "25"}, {"Date": "2017-11-20","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-21","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-22","Close Rate": "0.58","Sales": "25","Calls": "43"}, {"Date": "2017-11-23","Close Rate": "0.44","Sales": "22","Calls": "51"}, {"Date": "2017-11-24","Close Rate": "0.50","Sales": "23","Calls": "46"}, {"Date": "2017-11-25","Close Rate": "0.51","Sales": "22","Calls": "43"}, {"Date": "2017-11-26","Close Rate": "0.36","Sales": "15","Calls": "41"}, {"Date": "2017-11-27","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-28","Close Rate": "N/A","Sales": "0","Calls": "0"}, {"Date": "2017-11-29","Close Rate": "0.38","Sales": "16","Calls": "42"}, {"Date": "2017-11-30","Close Rate": "0.47","Sales": "26","Calls": "55"}]


const CloseRateField = {
    format: (val) => isNaN(val)
                    ? 'N/A'
                    : (val * 100).toFixed(0) + '%'
}

const baseMeta = {
    format: {
        'Date': (val) => moment(val).format('MMM D')
    }
}
const closeRateMeta = mergeDeep({
    headers: ['Date', 'Close Rate', 'Sales', 'Calls']
}, baseMeta);
const dtvMeta = mergeDeep({
    headers: ['Date', 'DTV Sales', 'Rolling Total', 'Pacing', 'Delta']
}, baseMeta);
const ahtMeta = mergeDeep({
    headers: [
        'Date', 'AHT', 'ACW', 'Hold', 'Calls'
    ]
}, baseMeta);
const prodMeta = mergeDeep({
    headers: ['Date', 'Productivity']
}, baseMeta);


dataTableRow = {
    props: ['datum', 'meta', 'isHighlighted'],
    template: `
        <tr v-bind:class="{ highlight: isHighlighted }">
            <td
              v-for="key in meta.headers"
              v-on:mouseover="highlightDate(datum)"
              v-on:mouseleave="unhighlightDate"
              v-bind:class="styleClass(datum[key], key)">
                {{ formatText(datum[key], key, meta) }}
            </td>
        </tr>`,
    methods: {
        highlightDate: function(datum) {
            this.$emit('hover-date', datum.Date);
        },
        unhighlightDate: function() {
            this.$emit('unhover-date');
        },
        formatText: function (val, key, meta) {
            if (meta.format.hasOwnProperty(key)) {
                return meta.format[key](val);
            }
            return val;
        },
        styleClass: function (val, key) {
            switch (key) {
                case 'AHT':
                    if (val == 'N/A') return '';
                    return moment(val, 'mm:ss').valueOf() <= moment('10:00', 'mm:ss').valueOf()
                            ? 'green' : 'red';
                default:
                    return '';
            }
        }
    }
};

singleValue = {
    props: ['value', 'title'],
    template: `
        <h3>{{ title }}</h3>
        <p class="metric">{{ value }}</p>
    `
};

widget = {
    field: 'CloseRate',

}

Vue.component('widget-box', {
    // props: ['data', aa],
});


// Table with fixed headers. Accepts JSON data.
Vue.component('data-table', {
    props: ['data', 'meta', 'highlightedDate'],
    template: `
        <div class="data-table-wrapper">
        <table class="data-table">
            <thead>
                <tr>
                    <th v-for="header in meta.headers"
                    >{{ header }}</th>
                </tr>
            </thead>
            <tbody>
                <tr is="data-table-row"
                  v-for="(datum, i) in data"
                  v-on:hover-date="highlightDate"
                  v-on:unhover-date="unhighlightDate"
                  :key="i"
                  :datum="datum"
                  :meta="meta"
                  :isHighlighted="highlightedDate == datum.Date"
                ></tr>
            </tbody>
        </table>
        </div>
    `,
    components: {
        'data-table-row': dataTableRow
    },
    methods: {
        highlightDate: function(date) {
            this.$emit('hover-date', date);
        },
        unhighlightDate: function() {
            this.$emit('unhover-date');
        }
    }
});

Vue.component('')


let vm = new Vue({
    el: '.content-wrapper',
    data: {
        dtvMeta: dtvMeta,
        dtvData: dtvData,

        closeRateData: closeRateData,
        closeRateMeta: closeRateMeta,

        ahtData: x,
        ahtMeta: ahtMeta,
        showAHT: true,

        productivityData: prodData,
        productivityMeta: prodMeta,
        showProductivity: true,

        metricDescription: 'Your AHT',
        highlightedDate: ''
    },

    methods: {
        highlightDate: function (date) {
            this.highlightedDate = date;
        },
        unhighlightDate: function () {
            console.log('top level unhigh');
            this.highlightedDate = '';
        },
        isHighlighted: function (date) {
            return date == highlightedDate;
        }
    }
})



//
// $(document).ready(() => {
//     const g1 = gauge('#gauge-wrapper-1', {
//         size: 200,
//         clipWidth: 200,
//         clipHeight: 200,
//         minValue: 0,
//         maxValue: 1,
//         labelFormat: d3.format('.0%'),
//         ringWidth: 10,
//         arcColorFn: d3.interpolateHsl(d3.hsl(60,0.9,0.5), d3.hsl(120,0.7,0.55)),
//         majorTicks: 3
//     });
//
//     g1.render();
//     g1.update(0.515);
// });


/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}
