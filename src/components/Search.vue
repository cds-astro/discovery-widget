<!-- src/components/Search.vue -->

<template>
  <div id="search-component">
    <input 
        v-on:input="
            search=$event.target.value
            // Call the filter method and send its result
            // to the tree component.
            $emit('filter', search)
        "
        v-bind:value="search"
        placeholder="Search...">
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';

@Component({
    name: 'search-component',
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
    width: 100%;
    margin-top: 10px;
}
input {
    width:100%;
}
</style>
