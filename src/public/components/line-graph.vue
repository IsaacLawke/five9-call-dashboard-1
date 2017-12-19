<!--
Line graph component.

Accepts data prop with structure:
{
  'yyyy-mm-dd': 1,
  'yyyy-mm-dd': 2, ...
}

 -->

<template>
<div class="line-graph">
    <div ref="graph-wrap" class="graph-wrap">
        <svg @click="toggleTable" @mousemove="mouseover" :width="width" :height="height">
            <text :x="55" :y="10">{{ yField }}</text>
            <g class="axis" ref="yaxis" :style="{transform: `translate(20px,${margin.top}px)`}"></g>
            <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
                <path class="area" :d="paths.area" />
                <path class="goal-line" :d="paths.goalLine" />
                <path class="line" :d="paths.line" />
                <path class="selector" :d="paths.selector" />
            </g>
        </svg>
    </div>

    <data-table
        v-if="showTable"
        @hoverDate="hoverDate"
        @unhoverDate="unhoverDate"
        :data="data"
        :highlightedDate="highlightedDate"
    ></data-table>
</div>
</template>

<script>

import DataTable from './data-table.vue';

const props = {
    xField: {default: 'x'},
    yField: {default: 'y'},
    data: {
        type: Array,
        default: () => []
    },
    margin: {
        type: Object,
        default: () => ({
            left: 40,
            right: 10,
            top: 15,
            bottom: 10,
        }),
    }
};

export default {
    name: 'line-graph',

    props,

    components: {
        'data-table': DataTable
    },

    data () {
        return {
            showTable: false,
            highlightedDate: null,
            width: 0,
            height: 0,
            paths: {
                area: '',
                line: '',
                selector: '',
                goalLine: ''
            },
            lastHoverPoint: {},
            scaled: {
                x: null,
                y: null,
            },
            points: [],
        };
    },

    computed: {
        padded() {
            const width = this.width - this.margin.left - this.margin.right;
            const height = this.height - this.margin.top - this.margin.bottom;
            return { width, height };
        },
        ceil() {
            return d3.max(this.data, (d) => d[this.yField]);
        }
    },

    mounted() {
        window.addEventListener('resize', this.onResize);
        this.onResize();
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    },

    watch: {
        width: function() { this.update(); },
        data: function() { this.update(); }
    },

    methods: {
        toggleTable() {
            this.showTable = !this.showTable;
        },

        hoverDate(date) {
            this.highlightedDate = date;
        },
        unhoverDate(date) {
            this.highlightedDate = null;
        },

        onResize() {
            this.width = this.$refs['graph-wrap'].offsetWidth;
            this.height = this.$refs['graph-wrap'].offsetHeight;
        },
        createArea: d3.area().x(d => d.x).y0(d => d.max).y1(d => d.y),
        createLine: d3.line().x(d => d.x).y(d => d.y).curve(d3.curveMonotoneX),
        createValueSelector: d3.area().x(d => d.x).y0(d => d.max).y1(0),
        initialize() {
            this.scaled.x = d3.scaleTime().rangeRound([0, this.padded.width]);
            this.scaled.y = d3.scaleLinear().range([this.padded.height, 0]);
            d3.axisLeft().scale(this.scaled.x);
            d3.axisBottom().scale(this.scaled.y);
        },
        update() {
            this.initialize();
            const parseTime = d3.timeParse('%Y-%m-%d');
            for (let d of this.data) {
                d[this.yField] *= 1;
                if (isNaN(d[this.yField])) d[this.yField] = 0;
            }

            this.scaled.x.domain(d3.extent(this.data, (d) => parseTime(d[this.xField])));
            this.scaled.y.domain([0, this.ceil]);
            this.points = [];

            // Draw goal line
            let goal = this.$store.getters.field(this.yField).goal;
            let goalPoints = this.scaled.x.domain().map((xVal) =>
                ({
                    x: this.scaled.x(xVal),
                    y: this.scaled.y(goal)
                })
            );
            this.paths.goalLine = this.createLine(goalPoints);

            // Create graph points
            for (let d of this.data) {
                this.points.push({
                    x: this.scaled.x(parseTime(d[this.xField])),
                    y: this.scaled.y(d[this.yField]),
                    max: this.height,
                });
            }
            // this.paths.area = this.createArea(this.points);
            this.paths.line = this.createLine(this.points);

            // draw axes
            d3.select(this.$refs.yaxis)
                .call(d3.axisLeft(this.scaled.y))
                .selectAll('path, .tick line').attr('stroke', '#ccc');
            d3.select(this.$refs.yaxis).selectAll('text').attr('#444');
        },
        mouseover({ offsetX }) {
            // console.log(offsetX);
            if (this.points.length > 0) {
                const x = offsetX - this.margin.left;
                const closestPoint = this.getClosestPoint(x);
                if (this.lastHoverPoint.index !== closestPoint.index) {
                    const point = this.points[closestPoint.index];
                    this.paths.selector = this.createValueSelector([point]);
                    this.$emit('select', this.data[closestPoint.index]);
                    this.lastHoverPoint = closestPoint;
                }
            }
        },
        getClosestPoint(x) {
            return this.points
                .map((point, index) => ({ x:
                    point.x,
                    diff: Math.abs(point.x - x),
                    index,
                }))
                .reduce((memo, val) => (memo.diff < val.diff ? memo : val));
        }
    }
};
</script>


<style scoped>
    .graph-wrap:hover {
        cursor: pointer;
    }
    .graph-wrap {
        height: 150px;
    }
    .graph-wrap text {
        text-anchor: middle;
        font-size: 0.8em;
    }

    h1, .content {
      margin-left: 20px;
    }
    label {
      display: inline-block;
      width: 150px;
    }

    .line {
        fill: none;
        stroke: steelblue;
        stroke-linejoin: round;
        stroke-linecap: round;
        stroke-width: 1.5;
    }
    .goal-line {
        fill: none;
        stroke: lightgrey;
        stroke-opacity: 0.7;
        stroke-width: 1.0;
    }
    .axis {
        font-size: 0.5em;
    }
</style>
