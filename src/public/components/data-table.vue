<template>
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
              :key="i"
              :datum="datum"
              :meta="meta"
            ></tr>
        </tbody>
    </table>
    </div>
</template>

<script>
import DataTableRow from './data-table-row.vue';

export default {
    props: ['data', 'meta'],
    components: {
        'data-table-row': DataTableRow
    },
    computed: {
        dateHighlighted: function() {
            return store.state.dateHighlighted;
        }
    }
}
</script>

<style>
</style>
