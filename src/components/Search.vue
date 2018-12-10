<!-- src/components/Search.vue -->

<template>
    <div id="search-component">
        <p>Keywords: </p>
        <div class="wrap">
            <input
                v-on:input="addKeywordsTag($event.target.value)"
                v-bind:value="search" placeholder="Search..." />
        </div>
        <TooltipComponent v-bind:type="0" v-bind:width="'150px'" v-bind:height="'70px'"> 
            <p>Search for specific collections by typing keywords (e.g. SDSS or AllWISE)</p>
        </TooltipComponent>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import TooltipComponent from './Tooltip.vue';
import { Tag } from './Filter.vue';

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

    public addKeywordsTag(val: string) {
        let tag = new Tag('=', val, val);
        
        this.$emit('updateFilterTags', {
            key: 'keywords',
            tag: tag,
        });
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
            color: gray;

            border-radius: 2px;
            width: 90%;
            border: 1px solid gray;

            padding: 5px;

            font-family: Helvetica, Arial, sans-serif;
        }
    }
}
</style>
