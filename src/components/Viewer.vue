<template>
    <div id="aladin-lite"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

// A is a global variable from aladin lite source code.
// It is declared for the typescript checker to understand it.
declare var A: any;

// Defining interface objects for the different events
// linked to Aladin-Lite.
interface AddHiPSSurveyData {
  ID: string;
  hips_service_url: string;
  hips_order: string;
  hips_tile_format: string;
}

interface AddMOCData {
  moc_access_url: string;
}

interface AddCatalogData {
  ID: string;
  obs_id: string;
  hips_service_url: string;
}

@Component({
    name: 'ViewerComponent',
})
export default class ViewerComponent extends Vue {
  /* The reference to the aladin-lite view is private.
      The view must only be changed by the methods of the ViewerComponent. */
    private aladin: any;

    private loadScriptIntoDOM(bodyElement: HTMLElement, url: string, onloadCallback?: () => void) {
        const scriptElement = document.createElement('script');
        scriptElement.setAttribute('src', url);
        scriptElement.async = false;
        if (onloadCallback) {
            scriptElement.onload = onloadCallback;
        }

        bodyElement.appendChild(scriptElement);
    }

    private mounted() {
        // Now the component is mounted we can load aladin lite.
        const bodyElement = document.getElementsByTagName('BODY')[0] as HTMLElement;
        // jQuery is a dependency for aladin-lite and therefore must be inserted in the DOM.
        this.loadScriptIntoDOM(bodyElement, 'http://code.jquery.com/jquery-1.12.1.min.js');
        // Then we load the aladin lite script.
        this.loadScriptIntoDOM(bodyElement, 'http://aladin.u-strasbg.fr/AladinLite/api/v2/beta/aladin.min.js', () => {
            // When the import has succeded we store the aladin js instance into its component
            this.aladin = A.aladin('#aladin-lite', {survey: 'P/DSS2/color', fov: 60});

            /* Event definitions. When one of the events defined below are emitted from other components, this component
            will catch them and execute a bunch of methods from the API of the viewer. This practise encapsulates the
            API of the viewer and then aims to be extended for other viewer than Aladin-lite (e.g. firefly). */

            // Event for adding an HiPS image (e.g. DSS2/color) in Aladin-Lite.
            this.$root.$on('addImage', (metadata: AddHiPSSurveyData) => {
                const order = (+metadata.hips_order);
                const hipsTileFormat = metadata.hips_tile_format.split(' ');
                let tileFormat = 'jpg';

                if (hipsTileFormat.indexOf('png') >= 0) {
                    tileFormat = 'png';
                }
                
                const imageSurvey = this.aladin.createImageSurvey(metadata.ID,
                    metadata.ID,
                    metadata.hips_service_url,
                    'j2000',
                    order, {
                        imgFormat: tileFormat,
                    });
                this.aladin.setImageSurvey(imageSurvey);
            });

            // Event for adding a multi-order coverage map of a survey/catalog in Aladin-Lite.
            this.$root.$on('addCoverage', (metadata: AddMOCData) => {
                const moc = A.MOCFromURL(metadata.moc_access_url);
                this.aladin.addMOC(moc);
            });

            // Event for adding a vizier catalog in Aladin-Lite.
            this.$root.$on('addCatalog', (metadata: AddCatalogData, centerViewport: number[], radiusViewport: number) => {
                if (metadata.hips_service_url) {
                    const hips = A.catalogHiPS(metadata.hips_service_url, {
                        onClick: 'showTable',
                        name: metadata.ID,
                    });
                    this.aladin.addCatalog(hips);
                } else {
                    const catalog = A.catalogFromVizieR(metadata.obs_id, centerViewport, radiusViewport, {
                        onClick: 'showTable',
                        limit: 1000,
                    });
                    this.aladin.addCatalog(catalog);
                }
            });

            const updateViewerCallback = () => {
                this.$root.$emit('updateViewer', [
                    this.aladin.getFovCorners(),
                    this.aladin.getRaDec(),
                ]);
            };

            // If the user zoom or change the view we emit an event giving the new positions of the FOV corners
            // to the other components.
            this.aladin.on('zoomChanged', updateViewerCallback);
            this.aladin.on('positionChanged', updateViewerCallback);
        });
    } 
}
</script>
<style>
/* Load the CSS file of aladin-lite */
@import "http://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.css";

#aladin-lite {
  width: 100%;
  height: 100vh;
  z-index: 0;
}

#aladin-lite .aladin-location {
  position:absolute;

  top:0%;
}

#aladin-lite .aladin-layersControl-container {
  position:absolute;

  top:30px;
}

#aladin-lite .aladin-fov {
  position:absolute;

}

#aladin-lite .aladin-gotoControl-container {
  position:absolute;

  top:30px;
  transform: translate(0%, 100%);
}

#aladin-lite .aladin-box {
  position:absolute;

  top:30px;
}

#aladin-lite .aladin-measurement-div {
  position: absolute;
}

</style>
