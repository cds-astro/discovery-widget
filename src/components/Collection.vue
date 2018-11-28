<!-- src/components/Collection.vue -->

<template>
    <div id="collection-component">
        <h4 v-bind:style="{color: inViewport()}">{{ collectionName() }}</h4>
        <p v-bind:style="{color: inViewport()}">{{ author() }}</p>
        <ul>
            <li class="table-component" v-for="i in tables.length"
                v-if="tables[i-1].obs_title && tables[i-1].filtered"
                v-on:mouseenter="showPopup(tables[i-1], $event.target)"
                v-on:mouseleave="hidePopup">
                <p v-if="tables[i-1].inViewport"
                    :style="{color: 'green'}">
                    {{ tableName(i - 1) }}
                </p>
                <p v-else
                    :style="{color: 'red'}">
                    {{ tableName(i - 1) }}
                </p>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import { HeaderDatasetType } from './Widget.vue';
import { isNullOrUndefined } from 'util';

type ID = string;

export interface HeaderSelectionEvent {
    header: HeaderDatasetType;
    offsetTop: number;
    offsetHeight: number;
    element: HTMLLIElement;
}

@Component({
    name: 'collection-component',
})
export default class CollectionComponent extends Vue {
    @Prop() public catalog!: Map<ID, HeaderDatasetType>;

    private tables: HeaderDatasetType[] = [];

    private popup: boolean = false;
    private catalogName: string = '';
    private authorName: string = '';
    private tableNames: string[] = [];
    @Watch('catalog')
    public changeCatalog(catalog: Map<ID, HeaderDatasetType>, oldCatalog: Map<ID, HeaderDatasetType>) {
        if (!isNullOrUndefined(catalog)) {
            this.update(catalog);
        }
    }

    public mounted() {
        console.log('Collection component MOUNTED');
        this.update(this.catalog);
    }

    private update(catalog: Map<ID, HeaderDatasetType>) {
        this.tables = Array.from(catalog.values());
        // For Vizier catalogs, we parse the obs_title field to get:
        // - the name of the catalog
        // - the name of the table
        // - the author name
        if (this.isVizierCatalog()) {
            // reset tableName
            this.tableNames = [];

            this.tables.forEach((table) => {
                const title = table.obs_title;
                if (!isNullOrUndefined(title)) {
                    const indices = new Array<number>();
                    for (let i = 0; i < title.length; i++) {
                        if (title[i] === '(') { indices.push(i); }
                    }

                    const lastIndex = indices.length - 1;
                    const catalogName = title.slice(0, indices[lastIndex - 1] - 1);
                    const authorName = title.slice(indices[lastIndex - 1] + 1, indices[lastIndex] - 2);
                    const tableName = title.slice(indices[lastIndex] + 1, title.length - 1);

                    this.catalogName = catalogName;
                    this.authorName = authorName;
                    this.tableNames.push(tableName);
                }
            });
        }
    }

    private showPopup(table: HeaderDatasetType, element: HTMLLIElement) {
        this.popup = true;

        console.log('lement', element.style)

        this.$emit('toggle-popup', {
            header: table,
            offsetTop: element.getBoundingClientRect().top,
            offsetHeight: this.$el.offsetHeight,
            element,
        });
    }

    private hidePopup() {
        this.popup = false;

        this.$emit('hide-popup');
    }

    private collectionName(): string {
        if (this.isVizierCatalog()) {
            return this.catalogName;
        } else {
            const tableID = Array.from(this.catalog.keys())[0];
            const beginTableIndex = tableID.lastIndexOf('/');
            return tableID.substr(0, beginTableIndex);
        }
    }

    private author(): string {
        if (this.isVizierCatalog()) {
            return this.authorName;
        }

        return '';
    }

    private tableName(id: number): string {
        if (this.isVizierCatalog()) {
            return this.tableNames[id];
        }
        return this.tables[id].obs_title;
    }

    private inViewport(): string {
        let res = false;
        this.tables.forEach((table) => {
            if (table.inViewport) {
                res = true;
            }
        });

        return res ? 'green' : 'red';
    }

    private isVizierCatalog(): boolean {
        if (this.tables.length === 0) {
            return !isNullOrUndefined(Array.from(this.catalog.values())[0].vizier_popularity);
        }

        return !isNullOrUndefined(this.tables[0].vizier_popularity);
    }
}
</script>

<style>
.table-component {
    padding: 5px 0px;
    color: green;
    list-style-type: none;
    text-align: left;
    border-top: 0.2px solid white;
    border-left: 0.2px solid white;
    position: relative;
    overflow: hidden;
}

#collection-component ul {
    background-color: lightgray;
    cursor: pointer;
}

#collection-component {
    margin-top: 5px;
    border: 1px solid darkgray;
}

#collection-component h4 {
    text-align: center;
}

#collection-component h4, #collection-component p {
    margin: 2px;
    word-wrap: break-word;
}

.table-component:hover {
    background-color: silver;
}
</style>
