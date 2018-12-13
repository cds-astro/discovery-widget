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

<style lang="scss">
html {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
*, *:before, *:after {
    -webkit-box-sizing: inherit;
    -moz-box-sizing: inherit;
    box-sizing: inherit;
}

body {
    overflow:hidden;
    margin:0;
}

/* CSS for the scrollbar */
@import './css/scrollbar.css';
/* Font Awesome */
@import url(//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css);

</style>


