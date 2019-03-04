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

                    <div v-if="record.bib_reference" id="bibcode">
                        <TooltipComponent>
                            <template slot="hover-element">
                                <ul v-if="record.bib_reference instanceof Array">
                                    <li v-for="bib in record.bib_reference">
                                        <a v-bind:href="'https://ui.adsabs.harvard.edu/#abs/' + encodeURIComponent(bib) + '/abstract'" target="_blank"><u>{{ bib }}</u></a>
                                    </li>
                                </ul>
                                <a v-else v-bind:href="'https://ui.adsabs.harvard.edu/#abs/' + encodeURIComponent(record.bib_reference) + '/abstract'" target="_blank"><u>{{ record.bib_reference }}</u></a>
                            </template>

                            <template slot="content">
                                <i class="ads"></i>
                                <p>Bibcode assigned by the ADS</p>
                            </template>
                        </TooltipComponent>
                    </div>
                </div>
                
                <div v-if="record.description" id="description"><p>{{ record.description }}</p></div>
                <div v-else id="description"><p>No description</p></div>

                <div class="footer" v-if="record.isImageType()">
                <TooltipComponent>
                    <template slot="hover-element">
                        <button class="add addImageHiPS" v-on:click="addCollection()">
                            <i class="fas fa-layer-group"></i>
                        </button>
                    </template>

                    <template slot="content">
                        <p>Add this HiPS image to a new layer</p>
                    </template>
                </TooltipComponent>

                <TooltipComponent>
                    <template slot="hover-element">
                        <button class="add addMOC" v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)">
                            <i class="fas fa-map-marked-alt"></i>
                        </button>
                    </template>

                    <template slot="content">
                        <p>Show the coverage map</p>
                    </template>
                </TooltipComponent>

                <TooltipComponent>
                    <template slot="hover-element">
                        <form :action="record.propertiesFileUrl()" method="post" target="_blank">
                            <button class="info"><i class="fas fa-file"></i></button>
                        </form>
                    </template>

                    <template slot="content">
                        <p>See the metadata</p>
                    </template>
                </TooltipComponent>
            </div>
            <div class="footer" v-else>
                <TooltipComponent>
                    <template slot="hover-element">
                        <button class="add addCatalog" v-on:click="addCollection()">
                            <i class="fas fa-layer-group"></i>
                        </button>
                    </template>

                    <template slot="content">
                        <p>Add this catalog to a new layer</p>
                    </template>
                </TooltipComponent>

                <TooltipComponent>
                    <template slot="hover-element">
                        <button class="add addMOC" v-if="record.data.moc_access_url" v-on:click="$root.$emit('addCoverage', record.data)">
                            <i class="fas fa-map-marked-alt"></i>
                        </button>
                    </template>

                    <template slot="content">
                        <p>Show the coverage map</p>
                    </template>
                </TooltipComponent>

                <TooltipComponent>
                    <template slot="hover-element">
                        <form v-if="record.isVizierCatalog()" :action="record.obs_description_url" method="post" target="_blank">
                            <button class="info"><i class="fas fa-info"></i></button>
                        </form>
                    </template>

                    <template slot="content">
                        <p>VizieR</p>
                    </template>
                </TooltipComponent>

                <TooltipComponent>
                    <template slot="hover-element">
                        <form :action="record.propertiesFileUrl()" method="post" target="_blank">
                            <button class="info"><i class="fas fa-file"></i></button>
                        </form>
                    </template>

                    <template slot="content">
                        <p>See the metadata</p>
                    </template>
                </TooltipComponent>
            </div>
            </div>

            
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

    border-radius: 2px;
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
            width: 100%;

            div {
                margin-top: 5px;
            }

            #title {
                margin: 0px 10px;
                padding: 10px 5px;
                border-bottom: 3px solid gray;
                text-align: center;

                #bibcode {
                    font-size: 15px;
                    text-align: right;
                    i {
                        display: inline-block;
                        font-size: 22px;
                        vertical-align: middle;
                        margin-right: 3px;
                    }

                    a {
                        color: #3498db;
                        display: inline-block;
                        font-style: italic;
                        vertical-align: middle;
                    }

                    i.ads {
                        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE0NDdweCIgaGVpZ2h0PSIxMjcxcHgiIHZpZXdCb3g9IjAgMCAxNDQ3IDEyNzEiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuOC4zICgyOTgwMikgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+U2xpY2UgMTwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCB4MT0iMTAwJSIgeTE9IjgwLjQ2NDUxMTYlIiB4Mj0iMCUiIHkyPSIyMS4wMTQwNjI4JSIgaWQ9ImxpbmVhckdyYWRpZW50LTEiPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNDA5RkZGIiBvZmZzZXQ9IjAlIj48L3N0b3A+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMyMTU3Q0YiIG9mZnNldD0iMTAwJSI+PC9zdG9wPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IHgxPSIxMDAlIiB5MT0iODAuNDY0NTExNiUiIHgyPSIwJSIgeTI9IjIxLjAxNDA2MjglIiBpZD0ibGluZWFyR3JhZGllbnQtMiI+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMwMDFDRkYiIHN0b3Atb3BhY2l0eT0iMCIgb2Zmc2V0PSIwJSI+PC9zdG9wPgogICAgICAgICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNUFFQUZGIiBzdG9wLW9wYWNpdHk9IjAuMjAxMzQxNzEyIiBvZmZzZXQ9IjEwMCUiPjwvc3RvcD4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgogICAgICAgIDxyYWRpYWxHcmFkaWVudCBjeD0iMzMuMjIzMjM4NiUiIGN5PSIyMy4zNTMyOTQlIiBmeD0iMzMuMjIzMjM4NiUiIGZ5PSIyMy4zNTMyOTQlIiByPSIxMDAlIiBpZD0icmFkaWFsR3JhZGllbnQtMyI+CiAgICAgICAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiNGRkZGRkYiIG9mZnNldD0iMCUiPjwvc3RvcD4KICAgICAgICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0ZGRkZGRiIgb2Zmc2V0PSIxMDAlIj48L3N0b3A+CiAgICAgICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJhZHNfcGFydGlhbF9sb2dvX2RhcmtfYmFja2dyb3VuZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI2My4wMDAwMDAsIC03Ni4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9ImJiYl9sb2dvIj4KICAgICAgICAgICAgICAgIDxnIGlkPSJQYWdlLTEiPgogICAgICAgICAgICAgICAgICAgIDxnIGlkPSJiYmJfbG9nbyI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxnIGlkPSJiYWNrZ3JvdW5kIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMTM4LjEyMjQ2NiwgNzYxLjY3ODgwMikgcm90YXRlKDU4LjAwMDAwMCkgdHJhbnNsYXRlKC0xMTM4LjEyMjQ2NiwgLTc2MS42Nzg4MDIpIHRyYW5zbGF0ZSg1ODguMTIyNDY2LCAyMDUuNjc4ODAyKSIgZmlsbD0iI0E1QTVBNSI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNTI4LjExMjg3NSwwLjcxOTAxNTk0NiBDODQzLjU5MjY5OSwwLjcxOTAxNTk0NiAxMDk5LjMzOTYzLDI1Ni40NjU5NDUgMTA5OS4zMzk2Myw1NzEuOTQ1NzY5IEMxMDk5LjMzOTYzLDgyMS4yMDIyMjQgOTM5LjY5Mjg4MSwxMDMzLjE3MTE4IDcxNy4wNzM4MTgsMTExMS4xNzgyMSBMNzE3LjA3MzgxNiwxMDc4LjkxMTMzIEM5MjIuNjA5NTM0LDEwMDIuMjc3ODcgMTA2OC45OTM2Myw4MDQuMjIyMTE1IDEwNjguOTkzNjMsNTcxLjk3NjUyNSBDMTA2OC45OTM2MywyNzMuMjczMzE3IDgyNi44NDY4MzksMzEuMTI2NTIzNyA1MjguMTQzNjMxLDMxLjEyNjUyMzcgQzMyMy4yMjQ0NzMsMzEuMTI2NTIzNyAxNTMuMTE2ODc0LDEyOC43OTczNzggNjEuMzU0MzIyNSwyOTYuODAxODcxIEMzNi4yNjU2MjcyLDM0Mi43MzU3ODkgMjUuNjQxODIwOSwzODguMzA0NTg3IDI1LjY0MTgyMDksMzg4LjMwNDU4NyBDMjUuNjQxODIwOSwzODguMzA0NTg3IDEwLjkyOTcxNDIsMzgxLjgzNjcwOCAwLjkxNDg4Nzc4MiwzNzkuNTA0NzgzIEM3MS4zMTMzODYzLDE0Ny41MzAwNTEgMjUzLjUwODM2NCwwLjcxOTAxNTk0NiA1MjguMTEyODc1LDAuNzE5MDE1OTQ2IFogTTMzNi45Nzk5NjYsMTExMC40MTIxOSBMMzM2Ljk3OTk2OSwxMDc4LjA3Mjk0IEMyMTUuODQxMzE3LDEwMzIuMjkyNTggMTIxLjQ0MTg2OSw5NTIuMTQwNDI0IDU5Ljc2MzE3ODIsODM5Ljg0MTgzOCBDNTkuNzYzMTc4Miw4MzkuODQxODM4IDM3LjM2NDcxOTIsODQ0LjAxMzYyOCAyOC41MzcwOTgzLDg0OS4xNTE0MzggQzk1LjYzMjM5MDMsOTY5LjgxMTMyMiAyMDUuMTcyMzA3LDEwNjMuNjIzODYgMzM2Ljk3OTk2NiwxMTEwLjQxMjE5IFoiIGlkPSJPdmFsLTEzIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICAgICAgPGcgaWQ9Im1hZ25pZnlpbmctZ2xhc3MiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDg0NS45NzIxMTMsIDkyMC42NTEwMzcpIHJvdGF0ZSg1OC4wMDAwMDApIHRyYW5zbGF0ZSgtODQ1Ljk3MjExMywgLTkyMC42NTEwMzcpIHRyYW5zbGF0ZSg0MjEuOTcyMTEzLCAxODguNjUxMDM3KSI+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTYuNTgwNjYsMzAzLjkzNDc1NCBDMzIuOTg1ODYzNCwyNDcuNDA2ODkgNjEuNjIzNzAxNSwxOTMuNDUyMzYgMTAyLjc3NjY4NiwxNDYuMTExMjY3IEMyNTQuNTkzNTQxLC0yOC41MzQwNDcxIDUxOS4yNDM0MTksLTQ3LjA0MDE2OTMgNjkzLjg4ODczMywxMDQuNzc2Njg2IEM4NjguNTM0MDQ3LDI1Ni41OTM1NDEgODg3LjA0MDE2OSw1MjEuMjQzNDE5IDczNS4yMjMzMTQsNjk1Ljg4ODczMyBDNTgzLjQwNjQ1OSw4NzAuNTM0MDQ3IDMxOC43NTY1ODEsODg5LjA0MDE2OSAxNDQuMTExMjY3LDczNy4yMjMzMTQgQzEwMi4xMDQwNTYsNzAwLjcwNzAwMyA2OS4xMzAxMzA0LDY1Ny42NjI4NDMgNDUuMzg2ODY2Miw2MTAuOTEzNDM0IEM3MC41MDIwNjA1LDU3MS45NTUwNTcgODUuMDc1ODc0Miw1MjUuNTYwMzUxIDg1LjA3NTg3NDIsNDc1Ljc2MTc0OCBDODUuMDc1ODc0Miw0MDkuMTkyNzQ3IDU5LjAzMzM1NiwzNDguNzA2MzAyIDE2LjU4MDY2LDMwMy45MzQ3NTQgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjOUI5QjlCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLTkiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMSkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQyNC4wMjkxODgsIDQyNC4wMjkxODgpIHJvdGF0ZSgtNDkuMDAwMDAwKSB0cmFuc2xhdGUoLTQyNC4wMjkxODgsIC00MjQuMDI5MTg4KSAiIGN4PSI0MjQuMDI5MTg4IiBjeT0iNDI0LjAyOTE4OCIgcj0iMzAwLjAyOTE4OCI+PC9jaXJjbGU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLTkiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMSkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQyNC4wMjkxODgsIDQyNC4wMjkxODgpIHJvdGF0ZSgtNDkuMDAwMDAwKSB0cmFuc2xhdGUoLTQyNC4wMjkxODgsIC00MjQuMDI5MTg4KSAiIGN4PSI0MjQuMDI5MTg4IiBjeT0iNDI0LjAyOTE4OCIgcj0iMzAwLjAyOTE4OCI+PC9jaXJjbGU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLTkiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQtMikiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQyNC4wMDAwMDAsIDQyNC4wMDAwMDApIHJvdGF0ZSgtNDkuMDAwMDAwKSB0cmFuc2xhdGUoLTQyNC4wMDAwMDAsIC00MjQuMDAwMDAwKSAiIGN4PSI0MjQiIGN5PSI0MjQiIHI9IjI2MCI+PC9jaXJjbGU+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAtNSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDI5LjM2MDUxMiwgMTExMi44NTczOTgpIHJvdGF0ZSgtNTguMDAwMDAwKSB0cmFuc2xhdGUoLTQyOS4zNjA1MTIsIC0xMTEyLjg1NzM5OCkgdHJhbnNsYXRlKDE1OC44NjA1MTIsIDg4NC44NTczOTgpIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAtNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjcwLjUxMDYyMywgMjEyLjA4NDUxMCkgcm90YXRlKDU3LjAwMDAwMCkgdHJhbnNsYXRlKC0yNzAuNTEwNjIzLCAtMjEyLjA4NDUxMCkgdHJhbnNsYXRlKDE5Ni41MTA2MjMsIC02MS45MTU0OTApIiBmaWxsPSIjOUI5QjlCIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS03IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3NC4wMDAwMDAsIDY4LjQzNzY2OSkgcm90YXRlKDkxLjAwMDAwMCkgdHJhbnNsYXRlKC03NC4wMDAwMDAsIC02OC40Mzc2NjkpICIgeD0iNi45OTk5OTk3IiB5PSIzMi45Mzc1ODkzIiB3aWR0aD0iMTM0IiBoZWlnaHQ9IjcxLjAwMDE1OTQiPjwvcmVjdD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuODIxMjEwMjZlLTEzLDI4Ni44MzA1NDkgTDYuODI0NzA3MjFlLTEzLDEzOC44MTQ3NDcgTDYuODI0OTk0ODJlLTEzLDE1NC42NDA3MzMgQzYuODIyOTA0NjdlLTEzLDExMy43NzE3MSAzMy4xMjE5NDI1LDgwLjY0MDgyMTcgNzQsODAuNjQwODIxNyBMNzQsODAuNjQwODIxNyBDMTE0Ljg2OTA3MSw4MC42NDA4MjE3IDE0OCwxMTMuNzczNDkgMTQ4LDE1NC42NDA5ODUgTDE0OCw5Ny4yNzM4MDQ2IEwxNDgsMjQ1LjI3NzM3MyBMMTQ4LDQ3My42OTM3NTggQzE0OCw1MTQuNTYwMDYxIDExNC44NzgwNTcsNTQ3LjY4ODc0NSA3NCw1NDcuNjg4NzQ1IEw3NCw1NDcuNjg4NzQ1IEMzMy4xMzA5Mjg1LDU0Ny42ODg3NDUgNi44MjEyMTAyNmUtMTMsNTE0LjU1NjkxOCA2LjgyMTIxMDI2ZS0xMyw0NzMuNjgxMDE2IEw2LjgyMTIxMDI2ZS0xMywyODYuODMwNTQ5IEw2LjgyMTIxMDI2ZS0xMywyODYuODMwNTQ5IFoiIGlkPSJSZWN0YW5nbGUtOSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAtNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjUzLjA1NzA5MywgMjYwLjAzMzQ5Nikgcm90YXRlKDUzLjAwMDAwMCkgdHJhbnNsYXRlKC0yNTMuMDU3MDkzLCAtMjYwLjAzMzQ5NikgdHJhbnNsYXRlKDE4Ny4wNTcwOTMsIDIzLjAzMzQ5NikiIGZpbGw9IiM4Nzg3ODciPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA5LjQzOTAxMiw0LjczMzM3NTE5IEMxMDQuNjExODY1LDMuNzQzMzE3NzEgOTkuNjEzMzQ3NSwzLjIyMzMyMTAxIDk0LjQ5MzM4NCwzLjIyMzMyMTAxIEM1My42MTUzMjY2LDMuMjIzMzIxMDEgMjAuNDkzMzg0LDM2LjM1NDIwOTcgMjAuNDkzMzg0LDc3LjIyMzIzMjEgTDIwLjQ5MzM4NCw2MS4zOTcyNDYzIEwyMC40OTMzODQsMjA5LjQxMzA0OCBMMjAuNDkzMzg0LDM5Ni4yNjM1MTUgQzIwLjQ5MzM4NCw0MzcuMTM5NDE3IDUzLjYyNDMxMjYsNDcwLjI3MTI0NSA5NC40OTMzODQsNDcwLjI3MTI0NSBDMTAwLjI5NjA3Nyw0NzAuMjcxMjQ1IDEwNS45NDI0ODQsNDY5LjYwMzY5NiAxMTEuMzYwMDQ4LDQ2OC4zNDEyMjYgQzc3LjY1NTM1MDIsNDYxLjQyODQ5MSA1Mi4zMDU0Mjg4LDQzMS41OTg2NTEgNTIuMzA1NDI4OCwzOTUuODQzNDggTDUyLjMwNTQyODgsMjA4Ljk5MzAxMyBMNTIuMzA1NDI4OCw2MC45NzcyMTA5IEw1Mi4zMDU0Mjg4LDc2LjgwMzE5NjcgQzUyLjMwNTQyODgsNDEuNzM1NDk2OCA3Ni42OTE1MDE0LDEyLjM2NTAwNzcgMTA5LjQzOTAxMiw0LjczMzM3NTE5IEwxMDkuNDM5MDEyLDQuNzMzMzc1MTkgWiIgaWQ9IlJlY3RhbmdsZS05IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg2NS45MjY3MTYsIDIzNi43NDcyODMpIHJvdGF0ZSgxODUuMDAwMDAwKSB0cmFuc2xhdGUoLTY1LjkyNjcxNiwgLTIzNi43NDcyODMpICI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cG9seWdvbiBpZD0iUmVjdGFuZ2xlLTkiIGZpbGw9IiM4Nzg3ODciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ3MC4zNzIzNzEsIDEwNi42NzQyMzUpIHJvdGF0ZSg1OC4wMDAwMDApIHRyYW5zbGF0ZSgtNDcwLjM3MjM3MSwgLTEwNi42NzQyMzUpICIgcG9pbnRzPSI0NTIuODcyMzcxIDYzLjk4NDM5MjUgNDg3Ljg3MjM3MSA2My45ODQzOTI1IDQ4Ny44NzIzNzEgMTQ5LjM2NDA3NyA0NTIuODcyMzcxIDEzOS45MTY2MjciPjwvcG9seWdvbj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODkxLjIwNjcyMywyODYuMTAzMzYyIEM4OTEuMjA2NzIzLDIwOC43MjY0MTIgODI4LjQ4MDMxMiwxNDYgNzUxLjEwMzM2MiwxNDYgQzY3My43MjY0MTIsMTQ2IDYxMSwyMDguNzI2NDEyIDYxMSwyODYuMTAzMzYyIEM2MTEsMzYzLjQ4MDMxMiA2NzMuNzI2NDEyLDQyNi4yMDY3MjMgNzUxLjEwMzM2Miw0MjYuMjA2NzIzIEM4MjguNDgwMzEyLDQyNi4yMDY3MjMgODkxLjIwNjcyMywzNjMuNDgwMzEyIDg5MS4yMDY3MjMsMjg2LjEwMzM2MiBaIiBpZD0iT3ZhbC0yMCIgZmlsbD0idXJsKCNyYWRpYWxHcmFkaWVudC0zKSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgICAgICA8ZyBpZD0iYSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTE1LjAwMDAwMCwgMjU4LjAwMDAwMCkiIGZvbnQtc2l6ZT0iNzAwIiBmb250LWZhbWlseT0iSGVsdmV0aWNhLUJvbGQsIEhlbHZldGljYSIgZmlsbD0iI0ZGRkZGRiIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRleHQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRzcGFuIHg9IjAiIHk9IjY3OSI+YTwvdHNwYW4+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RleHQ+CiAgICAgICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwODguNDM2ODUsODYzLjgwNDM3MyBDMTA4OC40MzY4NSw3NDUuNDAzMzQxIDEwMjEuMjY1NDUsNTYzLjIxMjUyIDEwMjEuMjY1NDUsNTYzLjIxMjUyIEMxMDIxLjI2NTQ1LDU2My4yMTI1MiAxMTYxLjA2Mjk0LDU1OC44NTk3NDkgMTI0Ni40MjMzNSw2MjguNjU0MDMzIEMxMzMwLjc3NDQzLDY5Ny42MjMwNDkgMTM2MC44MzE3LDgxMS45ODkwOTYgMTM1Ni4wNzg4Nyw4ODEuMTE3MTUyIEMxMzUxLjMyNjAzLDk1MC4yNDUyMSAxMzA4LjY1OTI2LDEwNDguNjUyMDYgMTI0Ni40MjMzNSwxMDk3LjE4NjUxIEMxMTUwLjI1MzQsMTE3Mi4xODQzIDEwMzEuMTA4OTIsMTE2MS4wNjg4NCAxMDMxLjEwODkyLDExNjEuMDY4ODQgQzEwMzEuMTA4OTIsMTE2MS4wNjg4NCAxMDg4LjQzNjg1LDk4Mi4yMDU0IDEwODguNDM2ODUsODYzLjgwNDM3MyBMMTA4OC40MzY4NSw4NjMuODA0MzczIFoiIGlkPSJSZWN0YW5nbGUtMTAiIGZpbGwtb3BhY2l0eT0iMC4wOSIgZmlsbD0iIzAwMDAwMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTE4OC45MTI0OTQsIDg2Mi40MDQ0NjUpIHJvdGF0ZSg1Mi4wMDAwMDApIHRyYW5zbGF0ZSgtMTE4OC45MTI0OTQsIC04NjIuNDA0NDY1KSAiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==);
                        background-repeat: no-repeat;
                        background-position: center center;
                        background-size: 35px;
                        content: " ";
                        width: 35px;
                        height: 35px;
                        display: inline-block;
                        vertical-align: middle;
                    }

                    p {
                                            display: inline-block;
                        vertical-align: middle;
                    }
                }
            }

            #description {
                margin-top: 5px;
                overflow-y: scroll;
                max-height: 150px;
                text-align: justify;
                
                border: 1px solid gainsboro;
                color: gray;

                padding: 6px;

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
