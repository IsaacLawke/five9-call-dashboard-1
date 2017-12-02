
let x = [{"Date":"11/1/2017","AHT":"13:25","ACW":"00:35","Hold":"01:31","Calls":"62"},{"Date":"11/2/2017","AHT":"14:00","ACW":"00:50","Hold":"01:18","Calls":"68"},{"Date":"11/3/2017","AHT":"11:27","ACW":"00:37","Hold":"01:27","Calls":"42"},{"Date":"11/4/2017","AHT":"11:31","ACW":"00:48","Hold":"01:40","Calls":"62"},{"Date":"11/5/2017","AHT":"13:01","ACW":"00:34","Hold":"01:31","Calls":"53"},{"Date":"11/6/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/7/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/8/2017","AHT":"13:30","ACW":"00:23","Hold":"01:16","Calls":"54"},{"Date":"11/9/2017","AHT":"12:10","ACW":"00:38","Hold":"01:19","Calls":"28"},{"Date":"11/10/2017","AHT":"14:29","ACW":"00:20","Hold":"01:38","Calls":"45"},{"Date":"11/11/2017","AHT":"11:51","ACW":"00:25","Hold":"01:16","Calls":"30"},{"Date":"11/12/2017","AHT":"12:00","ACW":"00:30","Hold":"01:19","Calls":"41"},{"Date":"11/13/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/14/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/15/2017","AHT":"13:46","ACW":"00:40","Hold":"01:29","Calls":"41"},{"Date":"11/16/2017","AHT":"13:47","ACW":"00:37","Hold":"01:29","Calls":"51"},{"Date":"11/17/2017","AHT":"15:05","ACW":"00:27","Hold":"01:25","Calls":"41"},{"Date":"11/18/2017","AHT":"12:09","ACW":"00:25","Hold":"01:35","Calls":"35"},{"Date":"11/19/2017","AHT":"12:54","ACW":"00:35","Hold":"01:22","Calls":"25"},{"Date":"11/20/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/21/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/22/2017","AHT":"11:29","ACW":"00:35","Hold":"01:46","Calls":"43"},{"Date":"11/23/2017","AHT":"11:35","ACW":"00:34","Hold":"01:40","Calls":"51"},{"Date":"11/24/2017","AHT":"13:35","ACW":"00:40","Hold":"01:45","Calls":"46"},{"Date":"11/25/2017","AHT":"13:00","ACW":"00:49","Hold":"01:36","Calls":"43"},{"Date":"11/26/2017","AHT":"12:23","ACW":"00:35","Hold":"01:41","Calls":"41"},{"Date":"11/27/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/28/2017","AHT":"N/A","ACW":"N/A","Hold":"N/A","Calls":"0"},{"Date":"11/29/2017","AHT":"14:18","ACW":"00:27","Hold":"01:27","Calls":"42"},{"Date":"11/30/2017","AHT":"11:30","ACW":"00:34","Hold":"01:42","Calls":"55"}]


Vue.component('data-table-row', {
    props: ['datum'],
    template: `<tr>
        <td
          v-for="(val,key) in datum"
          v-bind:class="styleClass(val,key)">
            {{ formatText(val, key) }}
        </td>
        </tr>`,
    methods: {
        formatText: function (val, key) {
            if (key == 'Date') {
                return moment(val, 'M/D/YYYY').format('MMM D');
            }
            return val;
        },
        styleClass: function (val, key) {
            if (key == 'Calls' && val > 0) return 'green';
            return '';
        }
    }
});


let vm = new Vue({
    el: '.aht',
    data: {
        agentData: x,
        showAHT: true,
        metricDescription: 'Your AHT'
    }
})


//
// const widgetAHT = {
//     metadata: {
//
//         updateRateMinutes: 5,
//
//     },
//     data: x
// }




//
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
//
// d = `Date	AHT	ACW	Hold	Calls
// 11/1/2017	13:25	00:35	01:31	62
// 11/2/2017	14:00	00:50	01:18	68
// 11/3/2017	11:27	00:37	01:27	42
// 11/4/2017	11:31	00:48	01:40	62
// 11/5/2017	13:01	00:34	01:31	53
// 11/6/2017	N/A	N/A	N/A	0.00
// 11/7/2017	N/A	N/A	N/A	0.00
// 11/8/2017	13:30	00:23	01:16	54
// 11/9/2017	12:10	00:38	01:19	28
// 11/10/2017	14:29	00:20	01:38	45
// 11/11/2017	11:51	00:25	01:16	30
// 11/12/2017	12:00	00:30	01:19	41
// 11/13/2017	N/A	N/A	N/A	0.00
// 11/14/2017	N/A	N/A	N/A	0.00
// 11/15/2017	13:46	00:40	01:29	41
// 11/16/2017	13:47	00:37	01:29	51
// 11/17/2017	15:05	00:27	01:25	41
// 11/18/2017	12:09	00:25	01:35	35
// 11/19/2017	12:54	00:35	01:22	25
// 11/20/2017	N/A	N/A	N/A	0.00
// 11/21/2017	N/A	N/A	N/A	0.00
// 11/22/2017	11:29	00:35	01:46	43
// 11/23/2017	11:35	00:34	01:40	51
// 11/24/2017	13:35	00:40	01:45	46
// 11/25/2017	13:00	00:49	01:36	43
// 11/26/2017	12:23	00:35	01:41	41
// 11/27/2017	N/A	N/A	N/A	0.00
// 11/28/2017	N/A	N/A	N/A	0.00
// 11/29/2017	14:18	00:27	01:27	42
// 11/30/2017	11:30	00:34	01:42	55`;
//
//
// //var csv is the CSV file with headers
// function csvJSON(csv, delimiter=','){
//
//   var lines=csv.split("\n");
//
//   var result = [];
//
//   var headers=lines[0].split(delimiter);
//
//   for(var i=1;i<lines.length;i++){
// 	  var obj = {};
// 	  var currentline=lines[i].split(delimiter);
//
// 	  for(var j=0;j<headers.length;j++){
// 		  obj[headers[j]] = currentline[j];
// 	  }
// 	  result.push(obj);
//   }
//
//   //return result; //JavaScript object
//   return result; //JSON
// }
//
//
