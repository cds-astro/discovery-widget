<!-- src/components/Tooltip.vue -->

<template>
    <div id="tooltip">
        <div v-if="type == 0" class="fa fa-question-circle question-icon" style="font-size:24px"></div>
        <span class="tooltiptext" v-bind:style="{'width': width, 'height': height}">
            <slot></slot>
        </span>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';

enum MarkType {
    Help,
    Info,
};

@Component({
    name: 'tooltip',
})
export default class TooltipComponent extends Vue {
    @Prop() type!: MarkType;

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
    border-bottom: 1px dotted black;
}

#tooltip .tooltiptext {
    visibility: hidden;
    
    background-color: white;
    color: black;
    text-align: center;
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
