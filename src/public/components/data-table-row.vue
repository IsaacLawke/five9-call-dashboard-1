<template>
    <tr v-bind:class="{ highlight: isHighlighted(datum) }">
        <td
          v-for="key in meta.headers"
          v-on:mouseover="highlightDate(datum)"
          v-on:mouseleave="unhighlightDate"
          v-bind:class="formatted(datum[key], key).styleClass">
            {{ formatted(datum[key], key).value }}
        </td>
    </tr>
</template>

<script>
import {formatValue} from '../javascript/scorecard-format.js';

export default {
    props: ['datum', 'meta'],
    methods: {
        isHighlighted: function(datum) {
            return this.$store.state.dateHighlighted == datum.Date;
        },
        highlightDate: function(datum) {
            this.$store.commit('hoverDate', datum.Date);
        },
        unhighlightDate: function() {
            this.$store.commit('unhoverDate');
        },
        formatted: function (val, field) {
            // if (field=='AHT') debugger;
            let res = formatValue(val, field);
            return res;
        }
    }
}
</script>
