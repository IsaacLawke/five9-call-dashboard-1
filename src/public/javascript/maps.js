function makeMap(callData) {
    let width = 960,
        height = 500;

    let calls = d3.map(callData, (d) => d.key);

    let color = d3.scaleThreshold()
        .domain(d3.range(1, 30, 4))
        .range(d3.schemeBlues[9]);

    let path = d3.geoPath();

    let svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    let x = d3.scaleLinear()
        .domain(d3.range(1, 30, 28))
        .rangeRound([600, 860]);

        // Key / legend
    let g = svg.append('g')
        .attr('class', 'key')
        .attr('transform', 'translate(0,40)');
    g.selectAll('rect')
        .data(color.range().map((d) => {
            d = color.invertExtent(d);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))
        .enter().append('rect')
          .attr('height', 8)
          .attr('x', (d) => x(d[0]))
          .attr('width', (d) => x(d[1]) - x(d[0]))
          .attr('fill', (d) => color(d[0]));

    g.append('text')
        .attr('class', 'caption')
        .attr('x', x.range()[0])
        .attr('y', -6)
        .attr('fill', '#000')
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text('Calls offered');
    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat((x, i) => x)
        .tickValues(color.domain()))
      .select('.domain')
        .remove();

    d3.queue()
        .defer(d3.json, 'http://localhost:3000/api/states')
        .defer(d3.json, 'http://localhost:3000/api/zip3-data')
        .await(ready);

    function ready(err, usa, zipData) {
        svg.append('g')
            .attr('class', 'zips')
          .selectAll('path')
          .data(zipData.features)
          .enter().append('path')
            .attr('d', path)
            .attr('fill', (d) => {
                let zip = d.properties.ZIP;
                let val = calls.has(zip)
                    ? calls.get(zip).value
                    : 0;
                return color(val);
            })
          .append('title')
            .text((d) => {
                let zip = d.properties.ZIP;
                let numCalls = calls.has(zip) ? calls.get(zip).value : 0;
                return `ZIP3: ${zip}\nCalls: ${numCalls}`;
            });

        svg.append('g')
            .attr('class', 'states')
          .selectAll('path')
          .data(usa.features)
          .enter().append('path')
            .attr('d', path);
    }
}

// Takes call data (by zip code), returns total calls by ZIP3
function process(data) {
    let callsByZip = d3.nest()
        .key((d) => d['Global.strSugarZipCode'].substring(0,3))
        .rollup((v) => v.length)
        .entries(data);
    return callsByZip;
}


d3.csv('http://localhost:3000/api/data', (data) => {
    data.forEach((d) => {
        d.CALLS = +d.CALLS;
    });

    makeMap(process(data));
});
