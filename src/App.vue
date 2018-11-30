<template>
  <div id="app">
    <ViewerComponent></ViewerComponent>
    <PanelIconComponent></PanelIconComponent>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ViewerComponent from './components/Viewer.vue';
import PanelIconComponent from './components/PanelIcon.vue';

@Component({
  components: {
    ViewerComponent,
    PanelIconComponent,
  },
})
export default class App extends Vue {}
</script>

<style lang="css">
body {
  overflow:hidden;
  margin:0;
}

@import './css/scrollbar.css';
</style>


