<!-- src/components/CollectionTree.vue -->

<template>
<div id="widget-component" v-bind:style="{ top: offsetTop.toString() + 'px' }">
    <QuitComponent v-on:quit="$emit('quit')"></QuitComponent>
    <h3 id="title">Collection Selection Tool</h3>
    <FilterComponent></FilterComponent>

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
        <SearchComponent v-on:filter="queryMOCServer($event)"></SearchComponent>
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
import { TreeViewportMOCServerQuery, TreeFilterMOCServerQuery, HeaderResponse } from './../MOCServerQuery';
import { RetrieveAllDatasetHeadersQuery } from './../MOCServerQuery';
import { Viewport } from './../Viewport';
import { isNullOrUndefined, isNull } from 'util';

export type ID = string;
export type HeaderDatasetType = HeaderResponse & {inViewport: boolean, filtered: boolean};

type CatalogueType = HeaderDatasetType[];

export class Tree {
    public children: Tree[];
    public parent: Tree;
    public ID: string;
    public catalogs: Map<ID, Map<ID, HeaderDatasetType>>;

    public catalogsList: Array<Map<ID, HeaderDatasetType>>;
    public catalogsToShow: Boolean[];
    public numberOfCatalogs: number;
    public inViewport: boolean;

    constructor(ID: string, parent: Tree) {
        this.children = [];
        this.ID = ID;
        this.catalogs = new Map<ID, Map<ID, HeaderDatasetType>>();
        this.catalogsList = [];
        this.catalogsToShow = [];
        this.inViewport = false;
        this.numberOfCatalogs = 0;
        this.parent = parent;
    }

    public getPath(): String[] {
        let currentNode = this;
        let path = [];
        while(!isNullOrUndefined(currentNode)) {
            path.push(currentNode.ID);
            let nextNode = null;
            nextNode = currentNode.parent;
            currentNode = nextNode;
        }
        return path.reverse();
    }

    public findNode(path: String[]): Tree {
        let currentNode = this;
        console.log('FIND NODE: ', path);
        while(path.length > 1) {
            path = path.slice(1);
            let nextNode = null;
            for (let i = 0; i < currentNode.children.length; ++i) {
                let child = currentNode.children[i];
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
        /*
        if (this.ID === path[0]) {
            if (path.length === 1) {
                return this;
            }
            const pathChild = path.slice(1);
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                const node = child.findNode(pathChild);
                if (!isNullOrUndefined(node)) {
                    return node;
                }
            }
        }
        */
    }

    public filter(tables: HeaderResponse[], tableToNode: Map<string, Tree>, tableToCat: Map<string, string>) {
        this.resetFiltering(); 
        tables.forEach(table => {
           const node = tableToNode.get(table.ID);
           const catID = tableToCat.get(table.ID);
            if (!isNullOrUndefined(node) && !isNullOrUndefined(catID)) {
               const cat = node.catalogs.get(catID);
                if (!isNullOrUndefined(cat)) {
                   const tableToShow = cat.get(table.ID);
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

    public viewport(tables: HeaderResponse[], tableToNode: Map<string, Tree>, tableToCat: Map<string, string>) {
        this.resetViewport();

        tables.forEach(table => {
            // Retrieve the catalogue with respect to the table
           const node = tableToNode.get(table.ID);
           const catID = tableToCat.get(table.ID);
            if (!isNullOrUndefined(node) && !isNullOrUndefined(catID)) {
               const cat = node.catalogs.get(catID);
                if (!isNullOrUndefined(cat)) {
                   const tableInViewport = cat.get(table.ID);
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
            for (let table of catalog.values()) {
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

    public addTable(tableID: string, tableHeader: HeaderDatasetType, tableToNode: Map<string, Tree>) {
        // Client category gives the tree path. Otherwise (e.g. for vizier tables), one can
        // construct the path directly by looking its ID.
        if (isNullOrUndefined(tableHeader.client_category)) {
            // In the case there is no client_category then we construct the path from its ID
            // and remove the last 'catID/tableID' from it because the Map the of catalogs will be stored
            // in the catalogs field.
            const categories = tableID.split('/');
            tableHeader.client_category = categories.slice(0, categories.length - 2).join('/');
        } 
        const client_category = tableHeader.client_category;

        const categories = client_category.split('/');
        const leaf = (categories.length == 1) && !categories[0];

        if (!leaf) {
            const id = categories[0];

            const childClientCategory = categories.slice(1).join('/');
            // update the client_category to remove what's in front of the first '/'
            tableHeader.client_category = childClientCategory;

            let existingChild = this.getChild(id);
            if (isNull(existingChild)) {
                existingChild = new Tree(id, this);
                this.children.push(existingChild);
            }

            existingChild.addTable(tableID, tableHeader, tableToNode);
        } else {
            // We are in a leaf
            let catID = '';
            if (tableID) {
                const beginTableIndex = tableID.lastIndexOf('/');
                catID = tableID.substr(0, beginTableIndex);
            }

            if (!this.catalogs.has(catID)) {
                const newCatalog = new Map<ID, HeaderDatasetType>([
                    [tableID, tableHeader ,]
                ]);

                this.catalogs.set(catID, newCatalog);

                this.catalogsList.push(newCatalog);
                this.catalogsToShow.push(true);
            } else {
               const cat = this.catalogs.get(catID);
                if (cat) {
                    cat.set(tableID, tableHeader);
                }
            }

            tableToNode.set(tableID, this);
        }
    }

    private resetFiltering() {
        for (let i = 0; i < this.catalogsList.length; ++i) {
           const catalog = this.catalogsList[i];
            for(let table of catalog.values()) {
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
            for(let table of catalog.values()) {
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
        this.catalogsList.forEach(cat => {
            for(let table of cat.values()) {
                if (table.filtered) {
                    numberOfTables++;
                }
            }
        });
        return numberOfTables;
    }

    private getChild(ID: string): Tree {
        let result = null;

        this.children.forEach(child => {
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
    private header : Map<ID, HeaderDatasetType> = new Map<ID, HeaderDatasetType>();
    private catalogues: Map<ID, Map<ID, HeaderDatasetType>> = new Map<ID, Map<ID, HeaderDatasetType>>();
    private tableToCat: Map<string, string> = new Map<string, string>();
    private tableToNode: Map<string, Tree> = new Map<string, Tree>();

    // Used by the template
    private cataloguesToShow: Array<Map<ID, HeaderDatasetType>> = [];
    private cataloguesList: Array<Map<ID, HeaderDatasetType>> = [];

    // Used for debug purposes
    private log: String = '';
    private search_expr: string = '';

    private viewport : Viewport = new Viewport();

    private numPrintedCollections: number = 0;

    private sliceBounds: number[] = [] 

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

    public mounted() {
        console.log('Tree component MOUNTED'); 
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
            console.log('view changed', this.viewport.toString());
        });

        this.$root.$on('viewportTree', (tablesInViewport: HeaderResponse[]) => {
            console.log('Viewport tree triggered!');
            /* Shallow copy of root: the objects within root are copied as references */
            const filteredRoot = new Tree(this.root.ID, this.root.parent);
            filteredRoot.children = this.root.children;
            filteredRoot.catalogs = this.root.catalogs;
            filteredRoot.catalogsList = this.root.catalogsList;
            filteredRoot.catalogsToShow = this.root.catalogsToShow;

            this.root.viewport(tablesInViewport, this.tableToNode, this.tableToCat);

            /* Update root so that it will be propagates through the tree component */
            this.root = filteredRoot;
        });

        this.$root.$on('filterTree', (tables: HeaderResponse[]) => {
            console.log('Filter tree triggered!');

            /* Shallow copy of root: the objects within root are copied as references */
            const filteredRoot = new Tree(this.root.ID, this.root.parent);
            filteredRoot.children = this.root.children;
            filteredRoot.catalogs = this.root.catalogs;
            filteredRoot.catalogsList = this.root.catalogsList;
            filteredRoot.catalogsToShow = this.root.catalogsToShow;

            filteredRoot.filter(tables, this.tableToNode, this.tableToCat);
            filteredRoot.checkInViewport();

            /* Update root so that it will be propagates through the tree component */
            this.root = filteredRoot;
        });

        this.$root.$on('retrieveAllDatasetHeaders', (tables: HeaderResponse[]) => {
            tables.forEach(table => {
                /* Constructs the catalogues here */
                const tableID = table.ID;
                const tableHeader: HeaderDatasetType = {
                    ID: table.ID,
                    obs_id: table.obs_id,
                    obs_title: table.obs_title,
                    client_category: table.client_category,
                    dataproduct_type: table.dataproduct_type,
                    inViewport: false,
                    filtered: true,
                    vizier_popularity: table.vizier_popularity,
                };
                /* Construct the tree by adding its client category */
                this.root.addTable(tableID, tableHeader, this.tableToNode); 
                /* Update tableToCat and headers*/
                let catID = '';
                if (tableID) {
                    const beginTableIndex = tableID.lastIndexOf('/');
                    catID = tableID.substr(0, beginTableIndex);
                }
                this.tableToCat.set(tableID, catID);
                //this.headers.set(tableID, tableHeader);
            });

            // Compute the number of catalogs
            this.root.numberCatalogs();
            console.log('The TREE', this.root);

            // Num of catalogues
            this.numPrintedCollections = this.catalogues.size;
            console.log('CATALOGUES: ', this.catalogues);
        });

        // Query the MOCServer for retrieving all the dataset headers
        // This list will always be plotted but we will see whether each dataset
        // falls into the viewport or not.
        RetrieveAllDatasetHeadersQuery.query(this);

        setInterval(() => {
            /* A request to the the MOCServer is performed only if the position of the view has not
            changed over a quite long period of time. Say 500ms.*/
            if (this.needToUpdateMenu) {
               const currentTime = (new Date()).getTime();
                if (currentTime - this.lastTimePositionChanged > 500) {
                    this.needToUpdateMenu = false;

                    const viewport = this.viewport;
                    TreeViewportMOCServerQuery.query(this, viewport);
                    this.lastTimePositionChanged = currentTime;
                }
            }
        }, 100);
    }

    private queryMOCServer(content: string): void {
        this.search_expr = content;
        TreeFilterMOCServerQuery.query(this, content);
    }

    private sliceHeaders(args: any) {
        console.log('page changed', args);
        // The page has changed, we reset the selection of collections
        this.selectPopup = false;
        this.showPopup = false;

        this.sliceBounds = args;
        this.updateShowHeaders();
    }

    private updateShowHeaders() {
        this.cataloguesList = this.cataloguesToShow.slice(
            this.sliceBounds[0],
            this.sliceBounds[1]
        );
    }
}
</script>
<style lang="scss">
#widget-component {
    display: flex;
    flex-direction: column;

    width: 15%;
    max-height: 70vh;

    position: absolute;
    top: 40px;
    left: 40px;

    background-color: white;
    color: black;

    #wrap-path {
        padding: 2px;

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
    }

    #footer {
        margin: 5px;
    }
}

ul {
    width: 100%;
    margin: 0;
}

p, h3, h4 {
    font-family: Helvetica, Arial, sans-serif;
    margin: 0;
}

p {
    font-size: 14px;
    line-height: 1.3;
}

#title {
    text-align: center;
    margin: 15px;
}
</style>