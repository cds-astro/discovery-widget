<!-- src/components/PanelIcon.vue -->

<template>
    <div id="panel-icon">
        <a id="open"
            v-on:click="showCollectionTree = !showCollectionTree"
            v-bind:style="{top: offsetTop.toString() + 'px'}"><i class="fas fa-database"></i></a>
        <WidgetComponent v-show="showCollectionTree"
            v-on:quit="showCollectionTree=false"
            v-bind:offsetTop="offsetTop"></WidgetComponent>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import WidgetComponent from './Widget.vue';

@Component({
    name: 'panel-icon',
    components: {
        WidgetComponent,
    },
})
export default class PanelIconComponent extends Vue {
    private showCollectionTree: boolean = false;
    private offsetTop: number = 100;
}
</script>

<style>
#panel-icon {
    position: absolute;
    z-index: 5;
        top: 6px;
}

#open {
    position: absolute;
    width: 32px;
    height: 32px;
    left: 4px;


    background: rgba(250,250,250,0.8);
    border-radius: 4px;
    border: none;
}

#open i {
    position: absolute;
    font-size: 26px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

#open:hover {
    background-color: #888;
}

@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
</style>