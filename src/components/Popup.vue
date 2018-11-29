<!-- src/components/Popup.vue -->

<template>
    <div id="popup-component">
        <div id="header">
            <div id="figure">
                <img v-bind:src="record.previewURL" alt="preview">
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
                <a id="quit"><i class="fa fa-times fa-lg"></i></a>
            </div>

            <div v-if="record.description" id="description"><p>{{ record.description }}</p></div>
            <div v-else id="description"><p>No description</p></div>
        </div>

        <!-- Check the type of the collection (i.e. image or catalog) -->
        <div id="bottombar" v-if="record.isImageType()">
            <div id="left">
                <button v-on:click="addCollection()"><p>Image</p></button>
                <button v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)"><p>Coverage</p></button>
            </div>
            <div id="right">
                <a v-bind:href="record.propertiesFileUrl()" target='_blank'><button><p>Properties</p></button></a>
            </div>
        </div>
        <div id="bottombar" v-else>
            <div id="left">
                <button v-on:click="addCollection()"><p>Catalog</p></button>
                <button v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)"><p>Coverage</p></button>
            </div>
            <div id="right">
                <a v-if="record.isVizierCatalog()" v-bind:href="record.obs_description_url" target='_blank'><button><p>Vizier</p></button></a>
                <a v-bind:href="record.propertiesFileUrl()" target='_blank'><button><p>Properties</p></button></a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import { RetrieveRecordCollectionQuery } from './../MOCServerQuery';
import { Viewport } from './../Viewport';
import { HeaderSelectionEvent } from './Collection.vue';
import { isNullOrUndefined } from 'util';

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
})
export default class PopupComponent extends Vue {
    @Prop() public collection!: HeaderSelectionEvent;
    @Prop() public viewport!: Viewport;

    private record: Record = new Record();

    @Watch('collection')
    public showPopup(collection: HeaderSelectionEvent, oldCollection: HeaderSelectionEvent) {
        console.log('show popup', collection);
        if (collection) {
            RetrieveRecordCollectionQuery.query(this, collection.header.ID);
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

<style>

#popup-component {
    left:100%;
    position: absolute;
    overflow: hidden;

    background-color: white;
    color: black;
    list-style-type: none;
    text-align: center;
    border: 1px solid black;
    border-radius: 2px;
    width: 402px;
    padding: 5px;
}

img {
  font-family: 'Helvetica';
  font-weight: 300;
  line-height: 2;  
  text-align: center;
  
  width: 100px;
  height: auto;
  display: block;
  position: relative;
}

img:after { 
  content: "\f127" " not available";
  
  font-size: 12px;
  font-family: FontAwesome;
  color: rgb(100, 100, 100);
  
  display: block;
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
}

#header, #content {
    float: left;
    padding: 0;
}

#header ul {
    margin: 0;
    padding: 0;
}

#figure {
    width: 100px;
    border: 1px solid black;
}

figcaption p {
    font-size: x-small;
    word-wrap: break-word;
}

#bottombar {
}

#content {
    width: 300px;
}

#description {
    overflow-y: scroll;
    text-align:justify;
    max-height: 150px;
    padding: 0px 5px;
    font-size:inherit;
}

#left, #right {
    bottom: 100%;
    margin-top: 10px;
}

#left {
    float: left;
}

#right {
    float: right;   
}

#header ul {
    width: 100px;
}

#header ul li.regime {
    font-size: small;
    word-wrap: break-word;
}

#content #title {
    width: 280px;
}

#quit {
    position: absolute;
    top: 0%;
    left:100%;
    transform: translate(-100%, 0%);
    border: none;
    background: rgba(250,250,250,0.8);
    border-radius: 2px;
    width: 24px;
    height: 24px;
}

#quit i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
#quit:hover {
    color: red;
}
</style>
