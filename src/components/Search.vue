<!-- src/components/Search.vue -->

<template>
    <div id="search-component">
        <p>Keywords: </p>
        <div class="wrap">
            <input @input="addKeywordsTag($event.target.value)"
                v-model="search" placeholder="Search..." />
        </div>
        <TooltipComponent v-bind:type="0" v-bind:width="'150px'" v-bind:height="'100px'"> 
            <p>Search for specific collections by typing keywords (e.g. SDSS or AllWISE)</p>
        </TooltipComponent>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import TooltipComponent from './Tooltip.vue';
import { Tag } from './Filter.vue';
import { isNullOrUndefined, isNull } from 'util';

@Component({
    name: 'search-component',
    components: {
        TooltipComponent,
    },
})
export default class SearchComponent extends Vue {
    private search: string = "";
    /*
    @Prop() deletedTag!: string;
    @Watch('deletedTag')
    public deleteTag(key: string, oldKey: string) {
        console.log('delete search tag', key);
        if (key === "keywords") {
            this.search = "";
        }
    }*/

    @Prop() updatedTagsFromWidget!: Map<string, Array<Tag>>;
    @Watch('updatedTagsFromWidget')
    public changeTagsFromWidget(newTags: Map<string, Array<Tag>>, oldTags: Map<string, Array<Tag>>) {
        const tags = newTags.get("keywords");
        if(isNullOrUndefined(tags)) {
            this.search = "";
        }
    }

    public mounted() {
        console.log('Search component MOUNTED');
    }

    public addKeywordsTag(input: string) {
        if (input) {
            let tag = new Tag('=', input, input);
            this.$emit('updateFilterTags', {
                key: 'keywords',
                tags: [tag],
            });
        } else {
            this.$emit('updateFilterTags', {
                key: 'keywords',
                tags: [],
            });
        }
    }
}
</script>

<style lang="scss">
#search-component {
    display: flex;
    align-items: center;
    
    margin: 0px 10px;

    .wrap {
        margin: 0px 10px;

        input {
            width: 100%;
            color: gray;

            border-radius: 2px;
            border: 1px solid gainsboro;

            padding: 5px;

            font-family: Helvetica, Arial, sans-serif;
        }
    }
}
</style>
