<template>
<div class="metric-wrapper stats-box">
    <h2 class="descriptor">{{ title }}</h2>
    <single-value
        v-for="(widget, i) in widgetsOfType('single-value')"
        v-bind="widget"
        :key="i"
    ></single-value>

    <line-graph
        v-for="(widget, i) in widgetsOfType('line-graph')"
        :data="data"
        :x-field="widget.fields.x"
        :y-field="widget.fields.y"
        :key="i"
    ></line-graph>

    <data-table
        v-for="(widget, i) in widgetsOfType('data-table')"
        @hoverDate="hoverDate"
        @unhoverDate="unhoverDate"
        :data="data"
        :highlightedDate="highlightedDate"
        :key="i"
    ></data-table>
</div>
</template>


<script>

import DataTable from './data-table.vue';
import LineGraph from './line-graph.vue';
import { formatValue } from '../javascript/scorecard-format';


const singleValue = {
    props: ['value', 'title', 'field'],
    template: `
        <div>
            <h3>{{ title }}</h3>
            <p class="metric"
              :class="formatted.styleClass">
                {{ formatted.value }}
            </p>
        </div>
    `,
    computed: {
        formatted: function() {
            return formatValue(this.value, this.field);
        }
    }
};

export default {
    props: ['title', 'widgets', 'data', 'meta'],
    components: {
        'single-value': singleValue,
        'data-table': DataTable,
        'line-graph': LineGraph
    },
    data: function() {
        return {
            highlightedDate: null
        }
    },
    methods: {
        widgetsOfType: function(type) {
            return this.widgets.filter((widget) => widget['component'] == type);
        },
        hoverDate: function(date) {
            this.highlightedDate = date;
        },
        unhoverDate: function(date) {
            this.highlightedDate = null;
        }
    }
}
</script>


<style>
.metric-wrapper > * {
    margin: 2em 0;
}
</style>
