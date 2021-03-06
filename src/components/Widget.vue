<!-- src/components/CollectionTree.vue -->

<template>
<div id="widget-component" v-bind:style="{ top: offsetTop.toString() + 'px' }">
    <QuitComponent v-on:quit="$emit('quit')"></QuitComponent>
    <div id="widget-title">
        <i v-if="!isLoading" class="fa fa-database fa-lg"></i>
        <i v-else class="fa fa-spinner fa-spin"></i>
        <h3>Sky Discovery</h3>
    </div>
    <FilterComponent 
        :updatedTagsFromWidget="sendTagsToFilter"
        :numAllDatasets="numAllDatasets"
        :numRemainingDatasets="root.numberOfCatalogs"
        @updateFilterTags="updateTags($event.key, $event.tags)"
        @excludePlausibleCollection="setExcludePlausibleCollections($event)">
    </FilterComponent>

    <div v-show="tagsList.length > 0" id="filter-tags">
        <ul v-if="excludePlausibleCollection">
            <li v-for="tag in tagsList" v-bind:style="{ 'background-color': '#3498db' }">
                <p>{{ tag.repr }}</p>
                <a @click="removeTag(tag)" class="delete-tag">
                    <i class="fa fa-times fa-lg"></i>
                </a>
            </li>
        </ul>
        <ul v-else>
            <li v-for="tag in tagsList" v-bind:style="{ 'background-color': 'rgb(191, 203, 217)' }">
                <p>{{ tag.repr }}</p>
                <a @click="removeTag(tag)" class="delete-tag">
                    <i class="fa fa-times fa-lg"></i>
                </a>
            </li>
        </ul>
    </div>

    <!-- Path -->
    <div id="wrap-path">
        <div id="path">
            <a id="home" v-on:click="
                p = p.slice(0, 1);
                currentNode = root.findNode(p);">
                <i class="fa fa-home fa-lg"></i>
            </a>
            <ul>
                <li v-for="i in p.length"
                    v-on:click="
                        p = p.slice(0, i);
                        currentNode = root.findNode(p);
                    ">
                    <p class="name">{{ p[i - 1] }}</p>
                    <p class="separator">/</p>
                </li>
            </ul>
        </div>
    </div>

    <div id="tree" v-on:scroll="scrollY = $event.target.scrollTop">
        <TreeComponent 
            v-bind:tree="currentNode"
            v-bind:viewport="viewport"
            v-bind:scrollPositionY="scrollY"
            v-on:addToPath="
                p.push($event);
                currentNode = root.findNode(p);">
        </TreeComponent>
    </div>

    <div id="footer">
        <SearchComponent
            :updatedTagsFromWidget="sendTagsToFilter"
            @updateFilterTags="updateTags($event.key, $event.tags)">
        </SearchComponent>
    </div>
</div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import SearchComponent from './Search.vue';
import CollectionComponent from './Collection.vue';
import QuitComponent from './QuitIcon.vue';
import TreeComponent from './Tree.vue';
import { HeaderSelectionEvent } from './Collection.vue';
import PopupComponent from './Popup.vue';
import FilterComponent from './Filter.vue';
import { Tag } from './Filter.vue';
import { TreeViewportMOCServerQuery, TreeFilterMOCServerQuery, HeaderResponse, createDatasetName } from './../MOCServerQuery';
import { RetrieveAllDatasetHeadersQuery } from './../MOCServerQuery';
import { Viewport } from './../Viewport';
import { isNullOrUndefined, isNull } from 'util';

export type ID = string;
export type HeaderDatasetType = HeaderResponse & {inViewport: boolean, filtered: boolean};

type CatalogueType = HeaderDatasetType[];

export class Tree {
    private static labels: Map<string, string> = new Map<string, string>([
        ['B', 'Copies of external databases, regularly updated'],
        ['I', 'Astrometric Data'],
        ['II', 'Photometric Data'],
        ['III', 'Spectroscopic Data'],
        ['IV', 'Cross-Identifications'],
        ['V', 'Combined data'],
        ['VI', 'Miscellaneous'],
        ['VII', 'Non-stellar Objects'],
        ['VIII', 'Radio and Far-IR data'],
        ['IX', 'High-Energy data'],
        ['J', 'Journals'],
        ['A+A', 'Astronomy and Astrophysics'],
        ['A+AS', 'Astronomy and Astrophysics Supplement Series'],
        ['AcA', 'Acta Astronomica'],
        ['AJ', 'Astronomical Journal'],
        ['AN', 'Astronomische Nachrichten'],
        ['ApJ', 'Astrophysical Journal'],
        ['ApJS', 'Astrophysical Journal Supplement Series'],
        ['AZh', 'Astronomicheskii Zhurnal (Russian)'],
        ['BaltA', 'Baltic Astronomy'],
        ['MNRAS', 'Monthly Notices of the Royal Astronomical Society'],
        ['other', 'publications from other journals'],
        ['PASJ', 'Publications of the Astronomical Society of Japan'],
        ['PASP', 'Publications of the Astronomical Society of the Pacific'],
        ['PAZh', 'Pis\'ma v Astronomicheskii Zhurnal (Astronomy Letters)'],
    ]);
    public children: Tree[];
    public parent: Tree;
    public ID: string;

    /* Hardcoded labels */
    public label: string;

    public catalogs: Map<ID, Map<ID, HeaderDatasetType>>;

    public catalogsList: Array<Map<ID, HeaderDatasetType>>;
    public catalogsToShow: Boolean[];
    public numberOfCatalogs: number;
    public inViewport: boolean;

    constructor(ID: string, parent: Tree, label: string = '') {
        this.children = [];
        this.ID = ID;
        this.catalogs = new Map<ID, Map<ID, HeaderDatasetType>>();
        this.catalogsList = [];
        this.catalogsToShow = [];
        this.inViewport = false;
        this.numberOfCatalogs = 0;
        this.parent = parent;
        this.label = label;
    }

    public getPath(): String[] {
        let currentNode = this;
        const path = [];
        while (!isNullOrUndefined(currentNode)) {
            path.push(currentNode.ID);
            let nextNode = null;
            nextNode = currentNode.parent;
            currentNode = nextNode;
        }
        return path.reverse();
    }

    public findNode(path: String[]): Tree {
        let currentNode = this;
        while (path.length > 1) {
            path = path.slice(1);
            let nextNode = null;
            for (let i = 0; i < currentNode.children.length; ++i) {
                const child = currentNode.children[i];
                if (child.ID === path[0]) {
                    nextNode = child;
                    break;
                }
            }
            currentNode = nextNode;
            if (isNullOrUndefined(currentNode)) {
                break;
            }
        }

        return currentNode;
    }

    public filter(tables: HeaderResponse[], tableToNode: Map<string, Tree>, tableToCat: Map<string, string>) {
        this.resetFiltering();
        tables.forEach((table) => {

                const name = createDatasetName(table);
                const node = tableToNode.get(name.dataset);
                const catID = tableToCat.get(name.dataset);

                if (!isNullOrUndefined(node) && !isNullOrUndefined(catID)) {
                    const cat = node.catalogs.get(catID);
                    if (!isNullOrUndefined(cat)) {
                    const tableToShow = cat.get(name.dataset);
                    if (!isNullOrUndefined(tableToShow)) {
                            tableToShow.filtered = true;
                            const id = node.catalogsList.indexOf(cat);
                            node.catalogsToShow[id] = true;
                        }
                    }
                }

        });

        // Compute the new number of catalogs per node
        this.numberCatalogs();
    }

    public needToMoveToRoot(): boolean {
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.numberOfCatalogs > 0) {
                return false;
            }
        }

        for (let i = 0; i < this.catalogsList.length; i++) {
            if (this.catalogsToShow[i]) {
                return false;
            }
        }

        return true;
    }

    public viewport(tables: HeaderResponse[], tableToNode: Map<string, Tree>, tableToCat: Map<string, string>) {
        this.resetViewport();

        tables.forEach((table) => {
            // Retrieve the catalogue with respect to the table
            const name = createDatasetName(table);

            const node = tableToNode.get(name.dataset);
            const catID = tableToCat.get(name.dataset);
            if (!isNullOrUndefined(node) && !isNullOrUndefined(catID)) {
               const cat = node.catalogs.get(catID);
               if (!isNullOrUndefined(cat)) {
                   const tableInViewport = cat.get(name.dataset);
                   if (tableInViewport) {
                        tableInViewport.inViewport = true;
                    }
                }
            }
        });

        // Check whether the nodes of the Tree are in the viewport
        // A node is in the viewport if there is at least one of its
        // sub-catalogs being in the viewport (i.e. one of its tables).
        this.checkInViewport();
    }

    public numberCatalogs(): number {
        let numberOfCatalogs = 0;
        if (!this.isLeaf()) {
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                numberOfCatalogs += child.numberCatalogs();
            }
        }

        numberOfCatalogs += this.numOfTables();
        this.numberOfCatalogs = numberOfCatalogs;
        return numberOfCatalogs;
    }

    public checkInViewport(): boolean {
        let inViewport = false;

        for (let i = 0; i < this.catalogsList.length; i++) {
            const catalog = this.catalogsList[i];
            for (const table of catalog.values()) {
                if (table.filtered && table.inViewport) {
                    inViewport = true;
                    break;
                }
            }
            if (inViewport) {
                break;
            }
        }

        for (let i = 0; i < this.children.length; ++i) {
            const child = this.children[i];
            const childInViewport = child.checkInViewport();
            inViewport = inViewport || childInViewport;
        }

        this.inViewport = inViewport;
        return inViewport;
    }

    public find(ID: string): Tree {
        if (ID === this.ID) {
            return this;
        } else {
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                const result = child.find(ID);
                if (!isNullOrUndefined(result)) {
                    return result;
                }
            }
        }
    }

    public addTable(path: string[], catalogName: string, datasetName: string, dataset: HeaderDatasetType, tableToNode: Map<string, Tree>) {
        const leaf = (path.length == 1);

        if (!leaf) {
            const id = path[0];
            const pathChild = path.slice(1);

            let existingChild = this.getChild(id);
            if (isNull(existingChild)) {
                let label = Tree.labels.get(id);
                if (isNullOrUndefined(label)) {
                    label = '';
                }
                existingChild = new Tree(id, this, label);
                this.children.push(existingChild);
            }

            existingChild.addTable(pathChild, catalogName, datasetName, dataset, tableToNode);
        } else {
            // We are in a leaf
            if (!this.catalogs.has(catalogName)) {
                const newCatalog = new Map<ID, HeaderDatasetType>([
                    [datasetName, dataset],
                ]);

                this.catalogs.set(catalogName, newCatalog);

                this.catalogsList.push(newCatalog);
                this.catalogsToShow.push(true);
            } else {
                const cat = this.catalogs.get(catalogName);
                if (cat) {
                    cat.set(datasetName, dataset);
                }
            }

            tableToNode.set(datasetName, this);
        }
    }

    public IdLesserThan(id1: string, id2: string) {
        const a = id1.match(/\d/g);
        const b = id2.match(/\d/g);

        if (isNullOrUndefined(a) && !isNullOrUndefined(b)) {
            return true;
        } else if (!isNullOrUndefined(a) && isNullOrUndefined(b)) {
            return false;
        } else if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
            return id1 < id2;
        }

        const n1 = +(a.join(''));
        const n2 = +(b.join(''));

        return n1 < n2;
    }

    public mergeSort(input: Tree[]): Tree[] {
        if (input.length == 1) {
            return input;
        }

        const middleIndex = Math.floor(input.length / 2);

        const tab1 = this.mergeSort(input.slice(0, middleIndex));
        const tab2 = this.mergeSort(input.slice(middleIndex));

        const result = [];
        let id1 = 0;
        let id2 = 0;
        while (result.length < input.length) {
            if (id1 == tab1.length) {
                result.push(tab2[id2]);
                id2 += 1;
            } else if (id2 == tab2.length) {
                result.push(tab1[id1]);
                id1 += 1;
            } else {
                if (this.IdLesserThan(tab1[id1].ID, tab2[id2].ID)) {
                    result.push(tab1[id1]);
                    id1 += 1;
                } else {
                    result.push(tab2[id2]);
                    id2 += 1;
                }
            }
        }

        return result;
    }

    public sort() {
        const children = this.children;
        if (children.length == 0) {
            return;
        }

        const sortedChildren = this.mergeSort(children);
        this.children = sortedChildren;

        for (let i = 0; i < this.children.length; ++i) {
            const child = this.children[i];
            child.sort();
        }
    }

    private resetFiltering() {
        for (let i = 0; i < this.catalogsList.length; ++i) {
           const catalog = this.catalogsList[i];
           for (const table of catalog.values()) {
                table.filtered = false;
            }

           this.catalogsToShow[i] = false;
        }

        for (let i = 0; i < this.children.length; ++i) {
            const child = this.children[i];
            child.resetFiltering();
        }
    }

    private resetViewport() {
        for (let i = 0; i < this.catalogsList.length; ++i) {
           const catalog = this.catalogsList[i];
           for (const table of catalog.values()) {
                table.inViewport = false;
            }
        }

        for (let i = 0; i < this.children.length; ++i) {
            const child = this.children[i];
            child.resetViewport();
        }
    }

    private numOfTables(): number {
        let numberOfTables = 0;
        this.catalogsList.forEach((cat) => {
            for (const table of cat.values()) {
                if (table.filtered) {
                    numberOfTables++;
                }
            }
        });
        return numberOfTables;
    }

    private getChild(ID: string): Tree {
        let result = null;

        this.children.forEach((child) => {
            if (child.ID === ID) {
                result = child;
            }
        });
        return result;
    }

    private isLeaf(): boolean {
        return (this.children.length === 0);
    }
}

@Component({
    name: 'widget-component',
    components: {
        SearchComponent,
        TreeComponent,
        FilterComponent,
        QuitComponent,
    },
})
export default class WidgetComponent extends Vue {
    /* To be aligned with the icon */
    @Prop()public  offsetTop!: number;
    private needToUpdateMenu: boolean = true;
    private lastTimePositionChanged: number = (new Date()).getTime();
    private header: Map<ID, HeaderDatasetType> = new Map<ID, HeaderDatasetType>();
    private catalogues: Map<ID, Map<ID, HeaderDatasetType>> = new Map<ID, Map<ID, HeaderDatasetType>>();
    private tableToCat: Map<string, string> = new Map<string, string>();
    private tableToNode: Map<string, Tree> = new Map<string, Tree>();

    private numAllDatasets: number = 0;

    // Used by the template
    private cataloguesToShow: Array<Map<ID, HeaderDatasetType>> = [];
    private cataloguesList: Array<Map<ID, HeaderDatasetType>> = [];

    // Used for debug purposes
    private log: string = '';

    private viewport: Viewport = new Viewport();

    private numPrintedCollections: number = 0;

    private sliceBounds: number[] = [];

    private init: boolean = true;

    /* Popup metadata */
    private showPopup: boolean = false;
    private selectPopup: boolean = false;
    private hoveredCollection: HeaderSelectionEvent;
    private collectionToShow: HeaderSelectionEvent = null;
    private scrollTop: number = 0;
    private positionPopup: number = 0;

    private root: Tree = new Tree('', null);

    private currentNode: Tree = this.root;
    private p: string[] = [''];

    private scrollY: number = 0;

    /* Filter tags */
    private tags: Map<string, Tag[]> = new Map<string, Tag[]>();
    private tagsList: Tag[] = [];
    private sendTagsToFilter: Map<string, Tag[]> = this.tags;

    /* Loading flag enabled when a HTTP request has been sent to the MOCServer, not received and not processed */
    private isLoading: boolean = false;

    /* Enable the filter by default */
    private excludePlausibleCollection: boolean = true;

    public mounted() {
        this.$root.$on('updateViewer', (args: any[]) => {
            const corners = args[0];
            const center = args[1];
            /* The position has changed in the view */
            this.viewport = new Viewport(
                center,
                corners[0],
                corners[1],
                corners[3],
                corners[2],
            );
            this.needToUpdateMenu = true;

            this.lastTimePositionChanged = (new Date()).getTime();
        });

        this.$root.$on('viewportTree', (tablesInViewport: HeaderResponse[]) => {
            /* Shallow copy of root: the objects within root are copied as references */
            const filteredRoot = new Tree(this.root.ID, this.root.parent);
            filteredRoot.children = this.root.children;
            filteredRoot.catalogs = this.root.catalogs;
            filteredRoot.catalogsList = this.root.catalogsList;
            filteredRoot.catalogsToShow = this.root.catalogsToShow;

            this.root.viewport(tablesInViewport, this.tableToNode, this.tableToCat);

            /* Update root so that it will be propagates through the tree component */
            this.root = filteredRoot;
            this.root.numberCatalogs();
        });

        this.$root.$on('filterTree', (tables: HeaderResponse[]) => {

            /* Shallow copy of root: the objects within root are copied as references */
            /*
            const filteredRoot = new Tree(this.root.ID, this.root.parent);
            filteredRoot.children = this.root.children;
            filteredRoot.catalogs = this.root.catalogs;
            filteredRoot.catalogsList = this.root.catalogsList;
            filteredRoot.catalogsToShow = this.root.catalogsToShow;
*/
            this.root.filter(tables, this.tableToNode, this.tableToCat);
            this.root.checkInViewport();

            /* Update root so that it will be propagates through the tree component */
            // this.root = filteredRoot;

            /* Move to root if there are no table in the current node */
            if (this.currentNode.needToMoveToRoot()) {
                this.p = [''];
                this.currentNode = this.root;
            }

            /* Get the number of resulting catalogs */
            this.root.numberCatalogs();
        });

        this.$root.$on('retrieveAllDatasetHeaders', (tables: HeaderResponse[]) => {
            tables.forEach((table) => {
                /* Constructs the catalogues here */
                const dataset: HeaderDatasetType = {
                    ID: table.ID,
                    obs_id: table.obs_id,
                    obs_title: table.obs_title,
                    client_category: table.client_category,
                    dataproduct_type: table.dataproduct_type,
                    inViewport: false,
                    filtered: true,
                    vizier_popularity: table.vizier_popularity,
                };

                const name = createDatasetName(dataset);
                /* Construct the tree by adding its client category */
                // Client category gives the tree path. Otherwise (e.g. for vizier tables), one can
                // construct the path directly by looking its ID.

                this.root.addTable(name.dataset.split('/'), name.catalog, name.dataset, dataset, this.tableToNode);
                /* Update tableToCat and headers*/
                /*
                let catID = '';
                if (tableID) {
                    const beginTableIndex = tableID.lastIndexOf('/');
                    catID = tableID.substr(0, beginTableIndex);
                }
                */
                this.tableToCat.set(name.dataset, name.catalog);
            });

            this.root.sort();

            // Compute the number of catalogs
            this.numAllDatasets = this.root.numberCatalogs();

            // Num of catalogues
            this.numPrintedCollections = this.catalogues.size;
        });

        // Query the MOCServer for retrieving all the dataset headers
        // This list will always be plotted but we will see whether each dataset
        // falls into the viewport or not.
        RetrieveAllDatasetHeadersQuery.send(this);

        setInterval(() => {
            /* A request to the the MOCServer is performed only if the position of the view has not
            changed over a quite long period of time. Say 500ms.*/
            if (this.needToUpdateMenu) {
               const currentTime = (new Date()).getTime();
               if (currentTime - this.lastTimePositionChanged > 1000) {
                    this.needToUpdateMenu = false;

                    const viewport = this.viewport;
                    TreeViewportMOCServerQuery.send(this, viewport);
                    this.lastTimePositionChanged = currentTime;
                }
            }
        }, 100);
    }

    public setLoading(isLoading: boolean) {
        this.isLoading = isLoading;
    }

    public setExcludePlausibleCollections(excludePlausibleCollection: boolean) {
        this.excludePlausibleCollection = excludePlausibleCollection;
        this.queryMOCServerOnFilter();
    }

    private queryMOCServerOnFilter(): void {
        TreeFilterMOCServerQuery.send(this, this.tags, this.excludePlausibleCollection);
    }

    private sliceHeaders(args: any) {
        // The page has changed, we reset the selection of collections
        this.selectPopup = false;
        this.showPopup = false;

        this.sliceBounds = args;
        this.updateShowHeaders();
    }

    private updateShowHeaders() {
        this.cataloguesList = this.cataloguesToShow.slice(
            this.sliceBounds[0],
            this.sliceBounds[1],
        );
    }

    private updateTags(key: string, tags: Tag[]) {
        if (tags.length == 0) {
            this.tags.delete(key);
        } else {
            this.tags.set(key, tags);
        }

        // Update the list of tags to show
        this.tagsList = [];
        Array.from(this.tags.values()).forEach((t) => {
            this.tagsList = this.tagsList.concat(t);
        });
        this.queryMOCServerOnFilter();
    }

    private removeTag(tagToRemove: Tag) {
        // let nextTagSet = new Map<string, Array<Tag>>(this.tags);
        let tagArrayCandidate = [];
        let keyCandidate;
        let id = -1;
        for (const [key, tags] of this.tags.entries()) {
            id = tags.indexOf(tagToRemove);
            if (id > -1) {
                tagArrayCandidate = tags;
                keyCandidate = key;
                // this.deletedTag = ;
                /*this.$nextTick(() => (this.deletedTag = ''));*/
                break;
            }
        }

        tagArrayCandidate.splice(id, 1);
        if (tagArrayCandidate.length == 0) {
            this.tags.delete(keyCandidate);
        } else {
            this.tags.set(keyCandidate, tagArrayCandidate);
        }
        // Update the list of tags to show
        this.tagsList = [];
        Array.from(this.tags.values()).forEach((t) => {
            this.tagsList = this.tagsList.concat(t);
        });

        this.sendTagsToFilter = new Map<string, Tag[]>(this.tags);

        this.queryMOCServerOnFilter();
    }
}
</script>
<style lang="scss">
#widget-component {
    display: flex;
    flex-direction: column;

    min-width: 290px;
    width: 17vw;
    max-height: 60vh;

    position: relative;
    top: 40px;
    left: 40px;

    background-color: white;
    color: black;

    #wrap-path {
        padding: 2px;
        border-top: 1px solid gainsboro;

        #path {
            display: flex;
            align-items: center;

            ul {
                list-style-type: none;
                padding: 0;
                margin: 5px 0px;
                
                p {
                    font-size: 15px;
                }

                li p.name {
                    cursor: pointer;
                    float: left;
                }

                li p.name:hover {
                    text-decoration: underline;
                }

                li p.separator {
                    float: left;
                    margin: 0px 3px;
                }
            }

            #home {
                position: relative;

                border: none;
                background: gainsboro;
                border-radius: 2px;
                width: 36px;
                height: 36px;
                font-size: 18px;

                &:hover {
                    background-color: lightgray;
                }

                i {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
            }   
        }
    }

    #tree {
        overflow-y: scroll;
        border-top: 1px solid gray;
        border-bottom: 1px solid gray;
    }

    #footer {
        margin: 5px;
    }
}

#filter-tags {
    ul {
        margin: 0;
        padding: 0;

        li {
            display: inline-block;
            padding: 2px;
            
            margin: 2px;

            background-color: #3498db;
            color: black;
            border-radius: 3px;

            color: #ffff;

            p {
                font-size: 11px;
                display: inline-block;
            }

            a.delete-tag {
                display: inline-block;
                margin: 1px;
            }

            a.delete-tag:hover {
                color: red;
                cursor: pointer;
            }
        }
    }
    border-top: 1px solid gainsboro;
}

ul {
    width: 100%;
    margin: 0;
}

p, h4, h3 {
    font-family: Helvetica,Arial,sans-serif;
    margin: 0;
}

p {
    font-size: 14px;
    line-height: 1.3;
    margin: 0;
}

#widget-title {
    text-align: center;
    margin: 7px;

    * {
        display: inline-block;
        vertical-align: middle;
    }

    i {
        font-size: 24px;
    }

    h3 {
        margin-left: 5px;
    }
}
</style>