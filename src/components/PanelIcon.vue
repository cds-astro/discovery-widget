<!-- src/components/PanelIcon.vue -->

<template>
    <div id="panel-icon">
        <a id="open"
            v-on:click="showCollectionTree = !showCollectionTree">
            
            <i>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
            </i>
        </a>
        <WidgetComponent v-show="showCollectionTree"
            v-on:quit="showCollectionTree=false"
            v-bind:offsetTop="0"></WidgetComponent>
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
}
</script>

<style>
#panel-icon {
    position: relative;
    z-index: 100;
}

#open {
    position: absolute;
    width: 32px;
    height: 32px;

    background: rgba(250,250,250,0.8);
    border-radius: 4px;
    border: none;
}

#open i {
    position: relative;

    top: 0%;
    left: 0%;
}

#open:hover {
    background-color: rgba(200,200,200,0.8);
}
</style>