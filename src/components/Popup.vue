<!-- src/components/Popup.vue -->

<template>
    <div id="popup-component" :style="{top: positionY.toString() + 'px'}">
        <div id="tail" :style="{transform: 'translate(-50%, -50%) translateY(' + (offsetY/2 + 10).toString() + 'px)'}"></div>
        <div id="top">
            <div id="header">
                <div id="figure">
                    <img v-if="record.isVizierCatalog()" v-bind:src="record.previewURL" alt="preview">
                    <img v-else v-bind:style="{ height: '125px' }" v-bind:src="record.previewURL" alt="preview">

                    <figcaption><p>{{ record.id }}</p></figcaption>
                </div>
                <ul v-if="record.obs_regime && record.obs_regime.length > 0">
                    <p>Band:</p>
                    <li class="regime" v-for="regime in record.obs_regime">
                        {{ regime }}
                    </li>
                </ul>
            </div>

            <div id="content">
                <div id="title">
                    <h4>{{ record.obs_title }}</h4>
                    <QuitComponent v-on:quit="$emit('quit')"></QuitComponent>
                </div>

                <div v-if="record.description" id="description"><p>{{ record.description }}</p></div>
                <div v-else id="description"><p>No description</p></div>
            </div>
        </div>
        
        <div class="footer" v-if="record.isImageType()">
 
            <TooltipComponent :width="'150px'" :height="'60px'">
                <template slot="hover-element">
                    <button class="add addImageHiPS" v-on:click="addCollection()">
                        <i class="fas fa-layer-group"></i>
                    </button>
                </template>

                <template slot="content">
                    <p>Add this HiPS image to a new layer</p>
                </template>
            </TooltipComponent>

            <TooltipComponent :width="'150px'" :height="'60px'">
                <template slot="hover-element">
                    <button class="add addMOC" v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)">
                        <i class="fas fa-map-marked-alt"></i>
                    </button>
                </template>

                <template slot="content">
                    <p>Show the coverage map</p>
                </template>
            </TooltipComponent>

            <TooltipComponent :width="'150px'" :height="'40px'">
                <template slot="hover-element">
                    <form :action="record.propertiesFileUrl()" method="post" target="_blank">
                        <button class="info"><i class="fas fa-file"></i></button>
                    </form>
                </template>

                <template slot="content">
                    <p>See the metadatas</p>
                </template>
            </TooltipComponent>
        </div>
        <div class="footer" v-else>
            <TooltipComponent :width="'150px'" :height="'60px'">
                <template slot="hover-element">
                    <button class="add addCatalog" v-on:click="addCollection()">
                        <i class="fas fa-layer-group"></i>
                    </button>
                </template>

                <template slot="content">
                    <p>Add this catalog to a new layer</p>
                </template>
            </TooltipComponent>


            <TooltipComponent :width="'150px'" :height="'60px'">
                <template slot="hover-element">
                    <button class="add addMOC" v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)">
                        <i class="fas fa-map-marked-alt"></i>
                    </button>
                </template>

                <template slot="content">
                    <p>Show the coverage map</p>
                </template>
            </TooltipComponent>

            <TooltipComponent :width="'100px'" :height="'40px'">
                <template slot="hover-element">
                    <form v-if="record.isVizierCatalog()" :action="record.obs_description_url" method="post" target="_blank">
                        <button class="info"><i class="fas fa-info"></i></button>
                    </form>
                </template>

                <template slot="content">
                    <p>VizieR</p>
                </template>
            </TooltipComponent>

            <TooltipComponent :width="'150px'" :height="'40px'">
                <template slot="hover-element">
                    <form :action="record.propertiesFileUrl()" method="post" target="_blank">
                        <button class="info"><i class="fas fa-file"></i></button>
                    </form>
                </template>

                <template slot="content">
                    <p>See the metadatas</p>
                </template>
            </TooltipComponent>

        </div>
        
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import { RetrieveRecordCollectionQuery } from './../MOCServerQuery';
import { Viewport } from './../Viewport';
import { HeaderSelectionEvent } from './Collection.vue';
import TooltipComponent from './Tooltip.vue';
import { isNullOrUndefined } from 'util';
import QuitComponent from './QuitIcon.vue';

class Record {
    public data: any;

    public id: string = '';
    public previewURL: string = '';
    public description: string = '';
    public obs_id: string = '';
    public obs_title: string = '';
    public dataproduct_type: string = '';
    public obs_description_url: string = '';
    public bib_reference: string = '';
    public obs_regime: string[] = [];
    public vizier_popularity: number;

    /* Only for vizier cats */
    public table_name: string = '';
    public catalog_name: string = '';
    public author_name: string = '';

    constructor(data?: any) {
        if (data) {
            this.data = data;

            this.description = this.data.obs_description;
            this.obs_id = this.data.obs_id;
            this.dataproduct_type = this.data.dataproduct_type;
            this.obs_title = this.data.obs_title;
            this.id = this.data.ID;
            this.obs_description_url = this.data.obs_description_url;
            this.vizier_popularity = this.data.vizier_popularity;

            if (!isNullOrUndefined(this.data.obs_regime)) {
                if (this.data.obs_regime instanceof Array) {
                    this.obs_regime = this.data.obs_regime;
                } else {
                    this.obs_regime.push(this.data.obs_regime);
                }
            }

            this.bib_reference = this.data.bib_reference;

            console.log('GET RECORD:', data);
            if (this.isImageType()) {
                this.previewURL = this.data.hips_service_url + '/preview.jpg';
            } else if (this.isVizierCatalog()) {
                this.previewURL = 'http://alasky.u-strasbg.fr/footprints/tables/vizier/' +
                    encodeURIComponent(this.data.obs_id.replace(/\//g, '_')) +
                    '/densityMap?format=png&size=small';

                /* Vizier cat */

            }
            console.log('preview URL: ', this.previewURL);
        }
    }

    public isImageType() {
        return this.dataproduct_type === 'image';
    }

    public isVizierCatalog() {
        return !isNullOrUndefined(this.vizier_popularity);
    }

    public propertiesFileUrl(): string {
        return RetrieveRecordCollectionQuery.getUrl(this.id, 'html');
    }
}

@Component({
    name: 'popup-component',
    components: {
        QuitComponent,
        TooltipComponent,
    },
})
export default class PopupComponent extends Vue {
    @Prop() public collection!: HeaderSelectionEvent;
    @Prop() public viewport!: Viewport;
    @Prop() public positionY!: number;
    @Prop() public offsetY!: number;

    private record: Record = new Record();

    @Watch('collection')
    public showPopup(collection: HeaderSelectionEvent, oldCollection: HeaderSelectionEvent) {
        console.log('show popup', collection);
        if (collection) {
            RetrieveRecordCollectionQuery.send(this, collection.header.ID);
        }
    }

    public mounted() {
        console.log('Popup component MOUNTED');

        this.$root.$on('retrieveRecordCollection', (response: any[]) => {
            const data = response[0];
            this.record = new Record(data);
            this.$root.$forceUpdate();
        });
    }

    public addCollection() {
        const isImage = this.record.isImageType();

        if (isImage) {
            this.$root.$emit('addImage', this.record.data);
        } else {
            // Vizier Catalog
            this.$root.$emit('addCatalog', this.record.data, this.viewport.getCenter(), this.viewport.getRadius());
        }
    }
}
</script>

<style lang="scss">

$space: 5px;
$width-img: 125px;
$size-tail: 10px;

#popup-component {
    left:100%;
    transform: translate($size-tail, -$size-tail);
    position: absolute;

    background-color: white;
    color: black;
    list-style-type: none;
    width: 180%;

    border-radius: 4px;
    border: 1px solid gray;

    padding: $space;

    #top {
        display: flex;
        align-items: flex-start;
        
        margin-bottom: $space;

        #header {
            flex-grow: 0;

            margin-right: $space;

            #figure {
                width: $width-img;
                border: 1px solid black;

                img {
                    display: block;
                    position: relative;

                    width: 100%;
                    height: auto;
                }

                img:before {
                    background-image: url("./../../images/thumbnail.jpeg");
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: $width-img $width-img;

                    width: 100%;
                    height: 100%;
                    
                    content: " ";
                    
                    display: block;
                    position: absolute;
                    z-index: 2;
                    top: 0;
                    left: 0;
                    background-color: white;
                }

                img:after {
                    content: "\f127" " not available";
                    font-size: 12px;
                    font-family: FontAwesome;
                    color: black;
                    display: block;
                    position: absolute;
                    z-index: 2;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                figcaption p {
                    font-size: x-small;
                    word-wrap: break-word;
                    font-family: Helvetica, Arial, sans-serif;
                    text-align: center;
                }
            }

            ul {
                width: 100%;
                text-align: center;
                
                li.regime {
                    font-size: small;
                    word-wrap: break-word;
                }
            }
        }

        #content {
            #title {
                margin: 0px 10px;
                padding: 10px 5px;
                border-bottom: 3px solid gray;
                text-align: center;
            }

            #description {
                margin-top: 5px;
                overflow-y: scroll;
                max-height: 150px;
                text-align: justify;

                p {  
                    /* These are technically the same, but use both */
                    overflow-wrap: break-word;
                    word-wrap: break-word;

                    -ms-word-break: break-all;
                    /* This is the dangerous one in WebKit, as it breaks things wherever */
                    word-break: break-all;
                    /* Instead use this non-standard one: */
                    word-break: break-word;

                    /* Adds a hyphen where the word breaks, if supported (No Blink) */
                    -ms-hyphens: auto;
                    -moz-hyphens: auto;
                    -webkit-hyphens: auto;
                    hyphens: auto;
                }
            }
        }
    }

    .footer {
        form {
            display: inline-block;
            margin: 0;
        }

        button {
            margin: 0;
            position: relative;

            border: none;
            color: white;
            
            border-radius: 4px;
            width: 36px;
            height: 36px;
            font-size: 22px;
            
            display: inline-block;
            
            vertical-align: middle;

            margin-right: 5px;
            
            &.info {
                background-color: #3498db;
                
                &:hover {
                    background-color: #4ab7ff;
                }
            }
            &.add {
                background-color: green;

                &:hover {
                    background-color: rgb(24, 189, 24);
                }
            }

            i {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            cursor: pointer;
        }


    }

    #tail {
        content: " ";

        position: absolute;
        left: 0%;
        top: 0%;

        margin-left: -$size-tail;

        border-width: $size-tail;
        border-style: solid;
        border-color: transparent white transparent transparent;
    }
}
</style>
