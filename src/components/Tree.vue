<!-- src/components/Tree.vue -->

<template>
    <div id="tree-component">
        <PopupComponent ref="popupComponent"
            v-show="showPopup && !popupOutOfBounds"
            v-bind:collection="collectionToShow"
            v-bind:viewport="viewport"
            v-on:exit="selectPopup=false"
            v-bind:style="{
                top: positionPopup.toString() + 'px',
            }">
        </PopupComponent>

        <ul id="path">
            <li class="directory" v-for="i in p.length"
                v-on:click="
                    p = p.slice(0, i);
                    root = tree.findNode(p);
                ">
                <a v-if="i==1" id="home"><i class="fa fa-home fa-lg"></i></a>
                <div v-else>
                    <p class="separator">/</p><p class="name">{{ p[i - 1] }}</p>
                </div>
            </li>
        </ul>
        <div id="scrollable" v-on:scroll="scrollAlongTree($event)">
            <div id="noleaf" v-if="root && !root.isLeaf()">
                <ul id="tree">
                    <li class="node" v-for="child in root.children"
                        v-if="child.numberOfCatalogs>0">
                        <!-- Leaf so print the collections -->
                        <p  v-if="child.inViewport"
                            v-bind:style="{color: 'green'}"
                            v-on:click="
                                root = child;
                                p.push(child.ID);
                                $emit('path-event', p);">
                            {{ child.ID }} {{ '(' + child.numberOfCatalogs + ')' }}
                        </p>
                        <p  v-else
                            v-bind:style="{color: 'red'}"
                            v-on:click="
                                root = child;
                                p.push(child.ID);
                                $emit('path-event', p);">
                            {{ child.ID }} {{ '(' + child.numberOfCatalogs + ')' }}
                        </p>
                    </li>
                </ul>
                <ul>
                    <li v-for="i in root.catalogsList.length"
                        v-if="root.catalogsToShow[i - 1]">
                        <CollectionComponent ref="childComponent"
                            v-bind:catalog="root.catalogsList[i - 1]"
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
                            v-on:toggle-popup="hoverCollection($event)"
                            v-on:hide-popup="leaveCollection()"
                            v-on:click.native="selectCollection()"
                            v-on:dblclick.native="dblClickClk($event)">
                        </CollectionComponent>
                    </li>
                </ul>
            </div>
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

    private p: String[] = [''];
    private root: Tree = null;

    /* Popup metadata */
    private showPopup: boolean = false;
    private selectPopup: boolean = false;
    private hoveredCollection: HeaderSelectionEvent;
    private collectionToShow: HeaderSelectionEvent = null;
    private scrollTop: number = 0;
    private positionPopup: number = 0;
    private popupOutOfBounds: boolean = false;

    @Watch('tree')
    public changeTree(newTree: Tree, oldRoot: Tree) {
        // Find the node where the user is so that the tree does not cd to its root
        const path = this.root.getPath();
        console.log('PATH ROOT', path)
        const newRoot = newTree.findNode(path);
        if (!isNullOrUndefined(newRoot)) {
            this.root = newRoot;
            this.$forceUpdate();
        }
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
            } else if (currentElement.id === 'quit') {
                return false;
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
                console.log('DESELECT')
                this.selectPopup = false;
                this.showPopup = false;

                if (!isNullOrUndefined(this.collectionToShow)) {
                    this.collectionToShow.element.style.backgroundColor = '';
                }
            }
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
        this.positionPopup = this.collectionToShow.offsetTop - this.$el.parentElement.offsetTop;

        this.collectionToShow.element.style.backgroundColor = 'darkgray';
        this.scrollTop = document.getElementById("scrollable").scrollTop;

        console.log('CLICK:', this.collectionToShow);
    }

    private hoverCollection(event: any) {
        console.log('HOVER:', event);
        this.hoveredCollection = event;
        // If there is no collection selected we show the popup of the collection
        // located under the mouse pointer.
        if (!this.selectPopup) {
            this.collectionToShow = this.hoveredCollection;
            this.showPopup = true;
            this.positionPopup = this.collectionToShow.offsetTop - this.$el.parentElement.offsetTop;
        }
    }

    private leaveCollection() {
        // Apply only when no collection is selected
        if (!this.selectPopup) {
            this.showPopup = false;
            console.log('leave');
        }
    }

    private scrollAlongTree(event: any) {
        // Update the position of the selected collection if there is any.
        if (this.selectPopup) {
            const deltaScroll = event.target.scrollTop - this.scrollTop;
            this.positionPopup = this.collectionToShow.offsetTop - this.$el.parentElement.offsetTop - deltaScroll;
        
            // Check whether the selection is out of the scrolling window.
            // If so, disable the plot of the popup
            this.popupOutOfBounds = false;
            let scrollableElement = document.getElementById("scrollable");
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

<style>

#scrollable {
    overflow-y: scroll;
    max-height: 60vh;
    width: 100%;
}

ul#tree {
    list-style-type: circle;
    background-color: lightgray;
}

ul {
    padding-left: 0;
}

ul#path {
    overflow: auto;
    list-style-type: none;
}

li.directory p.name {
    float: left;
    cursor: pointer;
}

li.directory p.name:hover {
    text-decoration: underline;
}

li.directory p.separator {
    float: left;
}

li.node:hover {
    background-color: silver;
    cursor: pointer;
}

#container-popup {
    position: absolute;
    left: 100%;
    height: 100%;
}

#home {
    position: relative;
    float: left;
    border: none;
    background: rgba(250,250,250,0.8);
    border-radius: 4px;
    width: 24px;
    height: 24px;
}

#home i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

#home:hover {
    background-color: darkgray;
}
</style>
