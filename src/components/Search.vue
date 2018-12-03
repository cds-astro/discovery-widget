<!-- src/components/Search.vue -->

<template>
    <div id="search-component">
        <p>Keywords: </p>
        <div class="wrap">
            <input
                v-on:input="
                    search=$event.target.value
                    // Call the filter method and send its result
                    // to the tree component.
                    $emit('filter', search)
                "
                v-bind:value="search" placeholder="Search..." />
        </div>
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

<style lang="scss">
#search-component {
    display: flex;
    align-items: center;
    
    margin: 0px 10px;

    .wrap {
        margin: 0px 5px;

        input {
            width: 100%;
            background-color: whitesmoke;
            border: 1px solid gainsboro;
            color: gray;

            padding: 0;
            padding: 2px 0px;

            font-family: Helvetica, Arial, sans-serif;
        }
    }
}
</style>
