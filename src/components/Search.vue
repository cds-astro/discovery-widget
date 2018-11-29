<!-- src/components/Search.vue -->

<template>
  <div id="search-component">
    <p>Keywords: </p>
    <input 
        v-on:input="
            search=$event.target.value
            // Call the filter method and send its result
            // to the tree component.
            $emit('filter', search)
        "
        v-bind:value="search"
        placeholder="Search...">
    <TooltipComponent v-bind:type="0" v-bind:text="'Search for specific collections by typing keywords (e.g. SDSS or AllWISE)'"></TooltipComponent>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import TooltipComponent from './Tooltip.vue';

@Component({
    name: 'search-component',
    components: {
        TooltipComponent,
    },
})
export default class SearchComponent extends Vue {
    private search: string = '';

    public mounted() {
        console.log('Search component MOUNTED');
    }
}
</script>

<style>
#search-component {
    display: flex;
}

#search-component input {
    margin: 0px 5px;
    width: 100%;
}

/*
#search-component .question-icon:hover {
    color: red;
    cursor: help;
}
*/
</style>
