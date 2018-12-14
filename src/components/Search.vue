<!-- src/components/Search.vue -->

<template>
    <div id="search-component">
        <p>Keywords: </p>
        <div class="wrap">
            <input type="text" @input="addKeywordsTag($event.target.value)"
                v-model="search" placeholder="Search..."/>
        </div>
        <TooltipComponent :width="'310px'" :height="'80px'">
            <template slot="hover-element">
                <i class="fa fa-question-circle question-icon" style="font-size:24px"></i>
            </template>

            <template slot="content">
                <p>Search for specific collections by typing:
                    <ul style="text-align: left;">
                        <li>keywords (e.g. SDSS or AllWISE)</li>
                        <li>a bibcode (e.g. 1978A&AS...34..477M)</li>
                    </ul>
                </p>
            </template>
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

$text-input-h: 20px;

#search-component {
    display: flex;
    align-items: center;
    
    margin: 0px 10px;

    .wrap {
        margin: 0px 10px;
        position: relative;

        input[type=text] {
            padding: 7px $text-input-h;
            width: 100%;
            background-color: whitesmoke;
            border-radius: 3px;
            border: 1px solid gainsboro;
            color: gray;
        }

        &:after {
            position: absolute;
            display: inline-block;
            top: 50%;
            left: 2px;
            transform: translate(0, -50%);
            color: black;
            
            font-family: FontAwesome;
            font-size: $text-input-h;
            content:"\f002";
        }
    }
}
</style>
