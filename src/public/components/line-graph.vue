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
        <svg @mousemove="mouseover" :width="width" :height="height">
            <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
                <path class="area" :d="paths.area" />
                <path class="line" :d="paths.line" />
                <path class="selector" :d="paths.selector" />
            </g>
        </svg>
    </div>
</template>

<script>
const props = {
    data: {
        type: Object,
        default: () => ({'x': ['2017-11-01', '2017-11-02', '2017-11-03', '2017-11-04'],
                        'y': [12, 2, 15, 9]
                    })
    },
    margin: {
        type: Object,
        default: () => ({
            left: 0,
            right: 0,
            top: 10,
            bottom: 10,
        }),
    },
    ceil: {
        type: Number,
        default: 20,
    },
};
export default {
    name: 'line-graph',
    props,
    data () {
        return {
            width: 0,
            height: 0,
            paths: {
                area: '',
                line: '',
                selector: '',
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
    },
    mounted() {
        window.addEventListener('resize', this.onResize);
        this.onResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    },
    watch: {
        width: function widthChanged() {
            this.initialize();
            this.update();
        },
    },
    methods: {
        onResize() {
            this.width = this.$el.offsetWidth;
            this.height = this.$el.offsetHeight;
        },
        createArea: d3.area().x(d => d.x).y0(d => d.max).y1(d => d.y),
        createLine: d3.line().x(d => d.x).y(d => d.y),
        createValueSelector: d3.area().x(d => d.x).y0(d => d.max).y1(0),
        initialize() {
            this.scaled.x = d3.scaleTime().rangeRound([0, this.padded.width]);
            this.scaled.y = d3.scaleLinear().range([this.padded.height, 0]);
            console.log(this.padded.height);
            d3.axisLeft().scale(this.scaled.x);
            d3.axisBottom().scale(this.scaled.y);
        },
        update() {
            const parseTime = d3.timeParse('%Y-%m-%d');

            this.scaled.x.domain(d3.extent(this.data.x, parseTime));
            this.scaled.y.domain([0, this.ceil]);
            this.points = [];

            for (let i=0; i < this.data.x.length; i++) {
                this.points.push({
                    x: this.scaled.x(parseTime(this.data.x[i])),
                    y: this.scaled.y(this.data.y[i]),
                    max: this.height,
                });
            }
            // this.paths.area = this.createArea(this.points);
            this.paths.line = this.createLine(this.points);
        },
        mouseover({ offsetX }) {
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
    h1, .content {
      margin-left: 20px;
    }
    label {
      display: inline-block;
      width: 150px;
    }
    .line-graph {
      height: 150px;
    }
    .line {
        fill: none;
        stroke: steelblue;
    }
</style>
