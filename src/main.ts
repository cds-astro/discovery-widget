import Vue from 'vue';
import DiscoveryTree from './DiscoveryTree.vue';

Vue.component('tree-aladin-v2', DiscoveryTree);

declare var aladin: any;
declare var A: any;

// This file is an example on how to
// define the wrapper between a viewer and
// the discovery tree vue component
new Vue({
  el: '#ui-components',
  data: {
    view: aladin,
  },
  methods: {
    getFovCorners() {
      return aladin.getFovCorners();
    },
    getCenter() {
      return aladin.getRaDec();
    },
    addImage(metadata) {
      const order = (+metadata.hips_order);
      const hipsTileFormat = metadata.hips_tile_format.split(' ');
      let tileFormat = 'jpg';

      if (hipsTileFormat.indexOf('png') >= 0) {
        tileFormat = 'png';
      }

      const imageSurvey = aladin.createImageSurvey(
        metadata.ID,
        metadata.ID,
        metadata.hips_service_url,
        'j2000',
        order, {
            imgFormat: tileFormat,
        },
      );
      aladin.setImageSurvey(imageSurvey);
    },
    addCatalog(metadata, center, radius) {
      if (metadata.hips_service_url) {
          const hips = A.catalogHiPS(metadata.hips_service_url, {
              onClick: 'showTable',
              name: metadata.ID,
          });
          aladin.addCatalog(hips);
      } else {
          const catalog = A.catalogFromVizieR(metadata.obs_id, center, radius, {
              onClick: 'showTable',
              limit: 1000,
          });
          aladin.addCatalog(catalog);
      }
    },
    addCoverage(metadata) {
      const moc = A.MOCFromURL(metadata.moc_access_url);
      aladin.addMOC(moc);
    },
  },
});
