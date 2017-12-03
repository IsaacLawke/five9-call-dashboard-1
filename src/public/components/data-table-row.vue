<template>
    <tr v-bind:class="{ highlight: isHighlighted(datum) }">
        <td
          v-for="key in meta.headers"
          v-on:mouseover="highlightDate(datum)"
          v-on:mouseleave="unhighlightDate"
          v-bind:class="styleClass(datum[key], key)">
            {{ formatText(datum[key], key, meta) }}
        </td>
    </tr>
</template>

<script>
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
        formatText: function (val, key, meta) {
            if (meta.format.hasOwnProperty(key)) {
                return meta.format[key](val);
            }
            return val;
        },
        styleClass: function (val, key) {
            switch (key) {
                case 'AHT':
                    if (val == 'N/A') return '';
                    return moment(val, 'mm:ss').valueOf() <= moment('10:00', 'mm:ss').valueOf()
                            ? 'green' : 'red';
                default:
                    return '';
            }
        }
    }
}
</script>
