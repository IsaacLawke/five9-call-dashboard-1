<template>
    <tr v-bind:class="{ highlight: isHighlighted }">
        <td
          v-for="(val, key) in datum"
          v-on:mouseover="highlightDate(datum)"
          v-on:mouseleave="unhighlightDate"
          v-bind:class="formatted(val, key).styleClass">
            {{ formatted(val, key).value }}
        </td>
    </tr>
</template>

<script>
import {formatValue} from '../javascript/scorecard-format.js';

export default {
    props: ['datum', 'headers', 'isHighlighted'],
    methods: {
        highlightDate: function(datum) {
            this.$emit('hoverDate', datum.Date);
        },
        unhighlightDate: function(datum) {
            this.$emit('unhoverDate', datum.Date);
        },
        formatted: function (val, fieldName) {
            let res = formatValue(val, this.$store.getters.field(fieldName));
            return res;
        }
    }
}
</script>
