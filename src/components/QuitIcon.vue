<!-- src/components/QuitIcon.vue -->

<template>
    <a id="quit">
        <i @click="$emit('quit')" class="fa fa-times fa-lg"></i>
    </a>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';

@Component({
    name: 'quit',
})
export default class QuitComponent extends Vue {
}
</script>

<style>
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
    cursor: pointer;
}
</style>
