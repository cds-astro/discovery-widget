<template>
  <PanelIconComponent></PanelIconComponent>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import PanelIconComponent from './components/PanelIcon.vue';

type Position = [number, number];
type Fov = [Position, Position, Position, Position];

@Component({
  components: {
    PanelIconComponent,
  },
})
export default class DiscoveryTree extends Vue {
    @Prop() public fov!: Fov;
    @Prop() public center!: Position;

    // Whenever the center has changed or the fov
    // this will cause the viewport to be recomputed
    @Watch('fov')
    public changeFov(newFov: Fov, oldFov: Fov) {
      this.fov = newFov;
      this.$root.$emit('updateViewer', [
        newFov,
        this.center,
      ]);
    }

    @Watch('center')
    public changeCenter(newCenter: Position, oldCenter: Position) {
      this.center = newCenter;
      this.$root.$emit('updateViewer', [
        this.fov,
        newCenter,
      ]);
    }
}
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

/* CSS for the scrollbar */
@import './css/scrollbar.css';
/* Font Awesome */
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");

</style>


