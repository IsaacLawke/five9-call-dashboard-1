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
        type: Array,
        default: () => [1,2,3,4,5],
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
            console.log('widthchanged');
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
            this.scaled.x = d3.scaleLinear().range([0, this.padded.width]);
            this.scaled.y = d3.scaleLinear().range([this.padded.height, 0]);
            console.log(this.padded.height);
            d3.axisLeft().scale(this.scaled.x);
            d3.axisBottom().scale(this.scaled.y);
        },
        update() {
            this.scaled.x.domain([0, d3.max(this.data)]);
            this.scaled.y.domain([0, this.ceil]);
            this.points = [];
            let i = 0;
            for (const d of this.data) {
                console.log(d);
                this.points.push({
                    x: this.scaled.x(i),
                    y: this.scaled.y(d),
                    max: this.height,
                });
                i++;
            }
            console.log(this.points);
            // this.paths.area = this.createArea(this.points);
            this.paths.line = this.createLine(this.points);
            console.log(this.paths.line);
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
