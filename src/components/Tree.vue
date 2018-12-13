<!-- src/components/Tree.vue -->

<template>
    <div id="tree-component">
        <PopupComponent ref="popupComponent"
            v-show="showPopup && !popupOutOfBounds"
            v-on:quit="hidePopup()"
            :collection="collectionToShow"
            :viewport="viewport"
            :positionY="positionPopup"
            :offsetY="collectionToShowHeight">
        </PopupComponent>

        <div id="noleaf" v-if="root && !root.isLeaf()">
            <ul>
                <li class="node" v-for="child in root.children"
                    v-if="child.numberOfCatalogs>0"
                    v-on:click="
                        //root = child;
                        $emit('addToPath', child.ID);">
                    <!-- Leaf so print the collections -->
                    <p  v-if="child.inViewport"
                        v-bind:style="{color: 'green'}">
                        {{ child.ID }} {{ '(' + child.numberOfCatalogs + ')' }}
                    </p>
                    <p  v-else
                        v-bind:style="{color: 'red'}">
                        {{ child.ID }} {{ '(' + child.numberOfCatalogs + ')' }}
                    </p>
                </li>
            </ul>
            <ul>
                <li v-for="i in root.catalogsList.length"
                    v-if="root.catalogsToShow[i - 1]">
                    <CollectionComponent ref="childComponent"
                        v-bind:catalog="root.catalogsList[i - 1]"
                        v-bind:directory="tree.ID"
                        v-on:toggle-popup="hoverCollection($event)"
                        v-on:hide-popup="leaveCollection()"
                        v-on:click.native="selectCollection()"
                        v-on:dblclick.native="dblClickClk($event)">
                    </CollectionComponent>
                </li>
            </ul>
        </div>
        <div id="leaf" v-else-if="root && root.isLeaf()">
            <ul>
                <li v-for="i in root.catalogsList.length"
                    v-if="root.catalogsToShow[i - 1]">
                    <CollectionComponent ref="childComponent"
                        v-bind:catalog="root.catalogsList[i - 1]"
                        v-bind:directory="tree.ID"
                        v-on:toggle-popup="hoverCollection($event)"
                        v-on:hide-popup="leaveCollection()"
                        v-on:click.native="selectCollection()"
                        v-on:dblclick.native="dblClickClk($event)">
                    </CollectionComponent>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import { HeaderSelectionEvent } from './Collection.vue';
import PopupComponent from './Popup.vue';
import CollectionComponent from './Collection.vue';
import { Viewport } from './../Viewport';

import { Tree } from './Widget.vue';
import { isNullOrUndefined } from 'util';

type ID = string;

@Component({
    name: 'TreeComponent',
    components: {
        CollectionComponent,
        PopupComponent,
    },
})
export default class TreeComponent extends Vue {
    @Prop() public tree!: Tree;
    @Prop() public viewport!: Viewport;

    @Prop() public scrollPositionY!: number;
    @Watch('scrollPositionY')
    public changeScrollPositionY(scrollY: number, prevScrollY: number) {
        this.scrollAlongTree(scrollY);
    }

    private root: Tree = null;

    /* Popup metadata */
    private showPopup: boolean = false;
    private selectPopup: boolean = false;
    private hoveredCollection: HeaderSelectionEvent;
    private collectionToShow: HeaderSelectionEvent = null;
    private scrollTop: number = 0;
    private positionPopup: number = 0;
    private popupOutOfBounds: boolean = false;

    private collectionToShowHeight: number = 0;

    @Watch('tree')
    public changeTree(newTree: Tree, oldRoot: Tree) {
        // Find the node where the user is so that the tree does not cd to its root
        /*
        const path = this.root.getPath();
        console.log('PATH ROOT', path);
        const newRoot = newTree.findNode(path);
        if (!isNullOrUndefined(newRoot)) {
            this.root = newRoot;
            this.$forceUpdate();
        }*/
        this.root = newTree;
    }

    /* Add the collection double clicked */
    /* Depends on the dataproduct type : image or catalog */
    public dblClickClk(event: any) {
        (this.$refs.popupComponent as PopupComponent).addCollection();
        this.deselectCollection(event, true);
    }

    public mounted() {
        console.log('Tree component MOUNTED');
        this.root = this.tree;

        // Managing collection popup deselection.
        document.addEventListener('click', (event) => {
            this.deselectCollection(event);
        });
    }

    private clickOnTable(event: any): boolean {
        let currentElement = event.target;
        while (!isNullOrUndefined(currentElement)) {
            const liElement = currentElement.classList[0]; 
            if (!isNullOrUndefined(liElement) && liElement.indexOf('table-component') !== -1) {
                return true;
            }

            currentElement = currentElement.parentElement;
        }

        return false;
    }

    private clickOnPopup(event: any): boolean {
        let currentElement = event.target;
        while (!isNullOrUndefined(currentElement)) {
            if (currentElement.id === 'popup-component') {
                return true;
            }

            currentElement = currentElement.parentElement;
        }

        return false;
    }

    /* Callbacks controlling the logic behind the
       selection/deselection of the collections. */
    private deselectCollection(event: any, dblClick: boolean = false) {
        if (!this.clickOnPopup(event)) {
            if (!this.clickOnTable(event) || dblClick) {
                this.hidePopup();
            }
        }
    }

    private hidePopup() {
        console.log('HIDE')
        this.selectPopup = false;
        this.showPopup = false;

        if (!isNullOrUndefined(this.collectionToShow)) {
            this.collectionToShow.element.style.backgroundColor = '';
        }
    }

    private selectCollection() {
        // Set the collection to show to the hovered one and block the hovering.
        this.selectPopup = true;
        this.popupOutOfBounds = false;

        if (!isNullOrUndefined(this.collectionToShow)) {
            this.collectionToShow.element.style.backgroundColor = '';
        }

        this.collectionToShow = this.hoveredCollection;
        this.collectionToShowHeight = this.collectionToShow.element.offsetHeight;
        
        let scrollableElement = this.$el.parentElement;
        let widgetElement = scrollableElement.parentElement;
        this.positionPopup = this.collectionToShow.offsetTop - widgetElement.offsetTop;

        this.collectionToShow.element.style.backgroundColor = 'lightgray';
        this.scrollTop = this.scrollPositionY;

        console.log('CLICK:', this.collectionToShow);
    }

    private hoverCollection(event: any) {
        console.log('HOVER:', event);
        this.hoveredCollection = event;
        // If there is no collection selected we show the popup of the collection
        // located under the mouse pointer.
        if (!this.selectPopup) {
            this.collectionToShow = this.hoveredCollection;
            this.collectionToShowHeight = this.collectionToShow.element.offsetHeight;

            this.showPopup = true;

            let scrollableElement = this.$el.parentElement;
            let widgetElement = scrollableElement.parentElement;
            this.positionPopup = this.collectionToShow.offsetTop - widgetElement.offsetTop;
        }
    }

    private leaveCollection() {
        // Apply only when no collection is selected
        if (!this.selectPopup) {
            this.showPopup = false;
            console.log('leave');
        }
    }

    private scrollAlongTree(scrollTopPosition: number) {
        // Update the position of the selected collection if there is any.
        if (this.selectPopup) {
            let scrollableElement = this.$el.parentElement;
            let widgetElement = scrollableElement.parentElement;

            const deltaScroll = scrollTopPosition - this.scrollTop;
            this.positionPopup = this.collectionToShow.offsetTop - widgetElement.offsetTop - deltaScroll;
        
            // Check whether the selection is out of the scrolling window.
            // If so, disable the plot of the popup
            this.popupOutOfBounds = false;
            
            const topWidget = scrollableElement.offsetTop;
            const bottomWidget = scrollableElement.offsetTop + scrollableElement.offsetHeight;

            const bottomTableElement = this.positionPopup + this.collectionToShow.element.offsetHeight;
            const topTableElement = this.positionPopup;

            if (bottomTableElement < topWidget || topTableElement > bottomWidget) {
                this.popupOutOfBounds = true;
            }
        }
    }
}
</script>

<style lang="scss">
#tree-component {
    background-color: white;
}

#tree-component ul#tree {
    list-style-type: circle;
}

#tree-component ul {
    padding-left: 0;
}

#tree-component li {
    list-style-type: none;
}

#tree-component li.node {
    border-top: 1px solid gainsboro;
    padding: 8px 10px;
}

#tree-component li.node:hover {
    background-color: gainsboro;
    cursor: pointer;
}

#tree-component #container-popup {
    position: absolute;
    left: 100%;
    height: 100%;
}
</style>
