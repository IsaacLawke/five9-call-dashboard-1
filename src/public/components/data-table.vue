<template>
<div class="data-table-wrapper">
    <table class="data-table">
        <thead>
            <tr>
                <th v-for="header in headers"
                >{{ header }}</th>
            </tr>
        </thead>
        <tbody>
            <tr is="data-table-row"
                v-for="(datum, i) in data"
                @hoverDate="hoverDate"
                @unhoverDate="unhoverDate"
                :key="i"
                :datum="datum"
                :isHighlighted="highlightedDate==datum.Date"
            ></tr>
        </tbody>
    </table>
</div>
</template>

<script>
import DataTableRow from './data-table-row.vue';

export default {
    props: ['data', 'highlightedDate'],
    components: {
        'data-table-row': DataTableRow
    },
    computed: {
        headers: function() {
            return Object.keys(this.data[0]);
        }
    },
    methods: {
        hoverDate: function(date) {
            this.$emit('hoverDate', date);
        },
        unhoverDate: function(date) {
            this.$emit('unhoverDate', date);
        }
    }
}
</script>

<style>
</style>
