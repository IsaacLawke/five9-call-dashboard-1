class CallMap {
    create(callData) {
        let width = 960,
            height = 500;
        let processedData = this.process(callData);

        this.calls = d3.map(processedData, (d) => d.key);
        let maxValue = d3.max(processedData, (d) => d.value);

        this.x = d3.scaleLinear()
            .domain(d3.extent(processedData, (d) => d.value))
            .rangeRound([600, 860]);

        this.color = d3.scaleThreshold()
            .domain(d3.range(1, maxValue, maxValue / 9))
            .range(d3.schemeBlues[9]);

        this.path = d3.geoPath();

        this.svg = d3.select('svg')
            .attr('width', width)
            .attr('height', height);

        // Key / legend
        this.g = this.svg.append('g')
            .attr('class', 'key')
            .attr('transform', 'translate(0,40)');
        this.g.selectAll('rect')
            .data(this.color.range().map((d) => {
                d = this.color.invertExtent(d);
                if (d[0] == null) d[0] = this.x.domain()[0];
                if (d[1] == null) d[1] = this.x.domain()[1];
                return d;
            }))
            .enter().append('rect')
              .attr('height', 8)
              .attr('x', (d) => this.x(d[0]))
              .attr('width', (d) => this.x(d[1]) - this.x(d[0]))
              .attr('fill', (d) => this.color(d[0]));

        this.g.append('text')
            .attr('class', 'caption')
            .attr('x', this.x.range()[0])
            .attr('y', -6)
            .attr('fill', '#000')
            .attr('text-anchor', 'start')
            .attr('font-weight', 'bold')
            .text('Calls offered');
        this.g.call(d3.axisBottom(this.x)
            .tickSize(13)
            .tickFormat(d3.format('d'))
            .tickValues(this.color.domain()))
          .select('.domain')
            .remove();

        d3.queue()
            .defer(d3.json, 'http://localhost:3000/api/states')
            .defer(d3.json, 'http://localhost:3000/api/zip3-data')
            .await((err, usa, zipData) => this.onReady(err, usa, zipData));
    }

    // draw initial map
    onReady(err, usa, zipData) {
        this.zipData = zipData;
        this.usa = usa;

        this.drawZips(zipData);
        this.drawStates(usa);
    }

    drawZips(zipData) {
        this.svg.insert('g', '.key')
            .attr('class', 'zips')
          .selectAll('path')
          .data(zipData.features)
          .enter().append('path')
            .attr('d', this.path)
            .attr('fill', (d) => {
                let zip = d.properties.ZIP;
                let val = this.calls.has(zip)
                    ? this.calls.get(zip).value
                    : 0;
                return this.color(val);
            })
          .append('title')
            .text((d) => {
                let zip = d.properties.ZIP;
                let numCalls = this.calls.has(zip) ? this.calls.get(zip).value : 0;
                return `ZIP3: ${zip}\nCalls: ${numCalls}`;
            });
    }

    drawStates(usa) {
        this.svg.insert('g', '.key')
            .attr('class', 'states')
          .selectAll('path')
          .data(usa.features)
          .enter().append('path')
            .attr('d', this.path);
    }

    drawKey(x, color) {
        this.g = this.svg.append('g')
            .attr('class', 'key')
            .attr('transform', 'translate(0,40)');
        this.g.selectAll('rect')
            .data(color.range().map((d) => {
                d = color.invertExtent(d);
                if (d[0] == null) d[0] = x.domain()[0];
                if (d[1] == null) d[1] = x.domain()[1];
                return d;
            }))
            .enter().append('rect')
              .attr('height', 8)
              .attr('x', (d) => x(d[0]))
              .attr('width', (d) => {
                  // TODO: some values negative
                  //if (this.x(d[1]) - this.x(d[0]) < 0) debugger;
                  return x(d[1]) - x(d[0]);
              } )
              .attr('fill', (d) => color(d[0]));

        this.g.append('text')
            .attr('class', 'caption')
            .attr('x', x.range()[0])
            .attr('y', -6)
            .attr('fill', '#000')
            .attr('text-anchor', 'start')
            .attr('font-weight', 'bold')
            .text('Calls offered');
          this.g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickFormat(d3.format('d'))
            .tickValues(color.domain()))
          .select('.domain')
            .remove();
    }

    update(callData) {
        // format the data properly
        let processedData = this.process(callData);
        // match calls to keys (zip codes)
        this.calls = d3.map(processedData, (d) => d.key);

        // update domain and range
        let maxValue = d3.max(processedData, (d) => d.value);
        this.x.domain(d3.range(1, maxValue, maxValue-2));
        this.color.domain(d3.range(1, maxValue, maxValue / 9));

        // Key / legend
        // remove then redraw the color key
        this.g.remove().exit();
        this.drawKey(this.x, this.color);

        // data - paint the state lines and zip codes
        // clear old states and zips
        this.svg.selectAll('.zips, .states').remove().exit();
        // then rebuild them
        this.drawZips(this.zipData);
        this.drawStates(this.usa);

        console.log('update done!');
    }

    // Takes call data (by zip code), returns total calls by ZIP3
    process(data) {
        let callsByZip = d3.nest()
            .key((d) => d[FIVE9_ZIP_FIELD].substring(0,3))
            .rollup((v) => v.length)
            .entries(data);
        return callsByZip;
    }
}
