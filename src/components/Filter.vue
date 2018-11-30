<!-- src/components/Filter.vue -->

<template>
    <div id="filter">
        <div @click="showForm = !showForm" id="icon">
            <p>Filter</p>
        </div>
        <div v-show="showForm" id="form">
            <QuitComponent v-on:quit="showForm=false"></QuitComponent>
            <div class="metadata">
                <div class="header">
                    <i class="fa fa-wifi fa-1x"></i>
                    <p>Bandwidth</p>
                </div>
                
                <select>
                    <option value="0">Select bandwidth</option>
                    <option value="1">Infrared</option>
                    <option value="2">Optical</option>
                    <option value="3">Gas-lines</option>
                    <option value="4">Gamma-ray</option>
                    <option value="5">UV</option>
                    <option value="6">Radio</option>
                    <option value="7">X</option>
                </select>
            </div>

            <div class="metadata">
                <div class="header">
                    <i class="fa fa-calendar"></i>
                    <p>Date</p>
                </div>
                <datepicker class="date-picker" :value="dates.min" :format="'dd MM yyyy'"></datepicker>
                <datepicker class="date-picker" :value="dates.max" :format="'dd MM yyyy'"></datepicker>
            </div>

            <div class="metadata">
                <div class="header">
                   <i class="fas fa-broadcast-tower"></i>
                    <p>Em</p>
                </div>
                <vue-slider class="range-slider" v-model="em" v-bind="options" :style="{'width':'100%'}"></vue-slider>
            </div>

            <div class="metadata">
                <div class="header">
                   <i class="fas fa-image"></i>
                   <p>Type</p>
                </div>
                <select>
                    <option value="0">Select collection type</option>
                    <option value="1">Image</option>
                    <option value="2">Catalog</option>
                </select>
            </div>

            <div class="metadata">
                <div class="header">
                   <i class="fas fa-wrench"></i>
                   <p>Telescope</p>
                </div>
                <select>
                    <option value="0">Select telescope</option>
                    <option value="1">HST</option>
                    <option value="2">XMM-Newton</option>
                    <option value="3">Gaia</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';
import QuitComponent from './QuitIcon.vue';
import Datepicker from 'vuejs-datepicker';
import vueSlider from 'vue-slider-component';

@Component({
    name: 'filter',
    components: {
        QuitComponent,
        Datepicker,
        vueSlider,
    },
})
export default class FilterComponent extends Vue {
    private showForm: boolean = true;
    private dates = {
        min: new Date(1970, 1,  1),
        max: new Date(),
    }

    private em = [0, 100];

    private options = {
        max: 300,
    }

    public mounted() {
        console.log('Filter component MOUNTED');
    }
}
</script>

<style lang="scss">
$size-lang: 20px;
$pos-y-lang: 20px;

#filter {
    position: relative;
}

#filter #icon {
    padding: 10px;
    border-top: 1px solid gainsboro;
    border-bottom: 1px solid gainsboro;
}

#filter #icon:hover {
    background-color: gainsboro;
    cursor: pointer;
}

#filter #form {
    position: absolute;
    left: 100%;
    top: 50%;
    
    padding: 10px;
    
    transform: translate($size-lang, -$size-lang) translateY(-$pos-y-lang);

    background-color: white;

    width: 400px;
}

#filter #form:after {
    content: " ";

    position: absolute;
    left: 0%;
    top: 0%;

    transform: translate(-100%, 50%) translateY($pos-y-lang);

    margin-top: -$size-lang;
    border-width: $size-lang;
    border-style: solid;
    border-color: transparent white transparent transparent;
}

#filter #form .metadata {
    padding: 25px 10px;
    display: flex;
    justify-content: space-around;
    align-items: center;

    border-bottom: 1px solid gainsboro;

    * {
        margin: 0px 3px;
    }

    div.header {
        display: flex;
        
        align-items: center;

        p {
        }

        i {
            font-size:22px;
        }
    }

    select {
        width: 100%;
    }

    input {
        width: 100%;
    }
}

</style>
