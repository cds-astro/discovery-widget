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
    @Prop() public width!: number;
    @Prop() public height!: number;
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
    padding: 2px;

    /* Position the tooltip */
    position: absolute;
    z-index: 10;

    left: 100%;
    top: 50%;
    transform: translate(0%, -50%);
    //margin-left: 5px;

    border: 1px solid gainsboro;
    white-space: nowrap;

    ul {
        //padding: 0px 1em;
    }
    img {
        width: 100%;
        height: 100%;
    }
}

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
