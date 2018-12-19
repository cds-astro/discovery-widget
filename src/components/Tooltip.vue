<!-- src/components/Tooltip.vue -->

<template>
    <div id="tooltip">
        <slot name="hover-element"></slot>
        <span class="tooltiptext" v-bind:style="{'width': width, 'height': height}">
            <slot name="content"></slot>
        </span>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';

@Component({
    name: 'tooltip',
})
export default class TooltipComponent extends Vue {
    @Prop() width!: number;
    @Prop() height!: number;

    public mounted() {
        console.log('Tooltip component MOUNTED');
    }
}
</script>

<style lang="scss">
#tooltip {
    position: relative;

    display: inline;
}

#tooltip .tooltiptext {
    visibility: hidden;
    
    background-color: white;
    color: black;

    border-radius: 2px;
    padding: 10px;

    /* Position the tooltip */
    position: absolute;
    z-index: 10;

    left: 100%;
    top: 50%;
    transform: translate(0%, -50%);
    margin-left: 5px;

    border: 1px solid gainsboro;

    ul {
        padding: 0px 1em;
    }
    img {
        width: 100%;
        height: 100%;
    }
}

/*
#tooltip .tooltiptext:after {
    content: " ";
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent red transparent transparent;
}
*/
#tooltip:hover .tooltiptext {
    visibility: visible;
}

#tooltip .question-icon:hover {
    color: red;
    cursor: help;
}

#tooltip .info-icon:hover {
    color: red;
    cursor: info;
}
</style>
