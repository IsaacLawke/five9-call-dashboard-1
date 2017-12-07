<template>
    <tr v-bind:class="{ highlight: isHighlighted }">
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
    props: ['datum', 'meta', 'isHighlighted'],
    methods: {
        highlightDate: function(datum) {
            this.$emit('hoverDate', datum.Date);
        },
        unhighlightDate: function(datum) {
            this.$emit('unhoverDate', datum.Date);
        },
        formatted: function (val, field) {
            let res = formatValue(val, field);
            return res;
        }
    }
}
</script>
