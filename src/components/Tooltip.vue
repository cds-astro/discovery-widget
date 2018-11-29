<!-- src/components/Tooltip.vue -->

<template>
    <div id="tooltip">
        <div v-if="type == 0" class="fa fa-question-circle question-icon" style="font-size:24px"></div>
        <span class="tooltiptext"><p>{{ text }}</p></span>
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
    @Prop() text!: string;
    /*
    @Watch('text')
    public changeText(newText: string, oldText: string) {
        // Find the node where the user is so that the tree does not cd to its root
        this.text = newText;
        console.log('new text', this.text);
        this.$forceUpdate();
    }*/

    public mounted() {
        console.log('Tooltip component MOUNTED');
    }
}
</script>

<style>
#tooltip {
    position: relative;
    border-bottom: 1px dotted black;
}

#tooltip .tooltiptext {
    visibility: hidden;
    width: 120px;
    background-color: steelblue;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px;

    /* Position the tooltip */
    position: absolute;
    z-index: 10;

    left: 100%;
    top: 50%;
    transform: translate(0%, -50%);
    margin-left: 5px;

    border: 1px solid white;
}

#tooltip .tooltiptext::after {
    content: " ";
    position: absolute;
    top: 50%;
    right: 100%; /* To the left of the tooltip */
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent steelblue transparent transparent;
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
