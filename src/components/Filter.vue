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
                
                <select v-on:change="addFilterTag($event.target.value, 'obs_regime')">
                    <option value="">Select bandwidth</option>
                    <option v-for="i in bandwidthList.length">{{ bandwidthList[i - 1] }}</option>
                </select>
            </div>

            <div class="metadata">
                <div class="header">
                    <i class="fa fa-calendar"></i>
                    <p>Date</p>
                </div>
                <datepicker class="date-picker" @selected="addDateFilterTag($event, 't_min')" :value="dates.min" :format="'dd MM yyyy'"></datepicker>
                <datepicker class="date-picker" @selected="addDateFilterTag($event, 't_max')" :value="dates.max" :format="'dd MM yyyy'"></datepicker>
            </div>

            <div class="metadata">
                <div class="header">
                   <i class="fas fa-broadcast-tower"></i>
                    <p>Em</p>
                </div>
                <vue-slider ref="slider" @callback="addEmFilterTag($event)" v-bind="options" v-bind:width="'100%'"></vue-slider>
                <select id="unit" v-on:change="changeEmUnit($event.target.value);">
                    <option>eV</option>
                    <option>Hz</option>
                    <option>m</option>
                </select>
                <TooltipComponent v-bind:type="0" v-bind:width="'504px'" v-bind:height="'385px'">
                    <img src="./../../images/A4C10.png"></img>
                </TooltipComponent>
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
import TooltipComponent from './Tooltip.vue';
import Datepicker from 'vuejs-datepicker';
import vueSlider from 'vue-slider-component';
import { dateToMJD } from './../utils';

export class Tag {
    constructor(operator: string, value: string, repr: string) {
        this.operator = operator;
        this.value = value;
        this.repr = repr;
    }

    public operator: string;
    public value: string;
    public repr: string;
}

type EmType = {
    value: Array<string>,
    data: Array<string>,
};

@Component({
    name: 'filter',
    components: {
        QuitComponent,
        Datepicker,
        vueSlider,
        TooltipComponent,
    },
})
export default class FilterComponent extends Vue {
    private showForm: boolean = false;
    @Watch('showForm')
    public changeShowForm(val: boolean, oldVal: boolean) {
        if(val) {
            this.$nextTick(() => this.$refs.slider.refresh());
        }
    }

    private dates = {
        min: new Date(1970, 1,  1),
        max: new Date(),
    }

    private data: Map<string, EmType> = new Map<string, EmType>([
        ['eV', {
            value: ["10e+0", "10e+2"],
            data: ["10e-10", "10e-8", "10e-6", "10e-4", "10e-2", "10e+0", "10e+2", "10e+4", "10e+6", "10e+8"],
        }],
        ['Hz', {
            value: ["10+10", "10+20"],
            data: ["10e+4", "10e+6", "10e+8", "10e+10", "10e+12", "10e+14", "10e+16", "10e+18", "10e+20", "10e+22"],
        }],
        ['m', {
            value: ["10e-12", "10e-6"],
            data: ["10e-14", "10e-12", "10e-10", "10e-8", "10e-6", "10e-4", "10e-2", "10e+0", "10e+2", "10e+4"],
        }],
    ]);
    private unit: string = 'eV';
    private em = this.data.get('eV');

    private options = {
        value: this.em.value,
        dotSize: 14,
        min: 1,
        max: 100,
        disabled: false,
        tooltip: "always",
        piecewise: true,
        data: this.em.data,
        formatter: "{value} eV",
    }

    private bandwidthList = [
        'Infrared',
        'Optical',
        'Gas-lines',
        'Gamma-ray',
        'UV',
        'Radio',
        'X',
    ];
    private defaultTags: Map<string, Tag> = new Map<string, Tag>([
        ['obs_regime', new Tag('=', '*', '')],
        ['dataproduct_type', new Tag('=', '*', '')],
        ['t_min', new Tag('>=', '0', '')],
        ['t_max', new Tag('<=', '100000', '')],
        ['em_min', new Tag('>=', '1E-13', '')],
        ['em_max', new Tag('<=', '1E4', '')],
    ]);
    private tags: Map<string, Tag> = new Map<string, Tag>(this.defaultTags);

    public mounted() {
        console.log('Filter component MOUNTED');
    }

    private addFilterTag(val: string, key: string) {
        let nextTag = null;

        if (val.length === 0) {
            nextTag = this.defaultTags.get(key);
        } else {
            let currentTag = this.tags.get(key);
            nextTag = new Tag(currentTag.operator, val, val);
        }

        this.tags.set(key, nextTag);
        this.$emit('updateFilterTags', this.tags);
    }

    private addDateFilterTag(val: Date, key: string) {
        let tag = this.tags.get(key);
        tag.value = dateToMJD(val).toString();
        tag.repr = tag.operator + val.toDateString();

        this.tags.set(key, tag);
        this.$emit('updateFilterTags', this.tags);
    }

    private changeEmUnit(unit: string) {
        this.unit = unit;
        console.log('UNIT', unit);
        this.em = this.data.get(unit);
        this.options.data = this.em.data;
        this.options.value = this.em.value;
        this.options.formatter = "{value} " + unit;
    }

    private addEmFilterTag(values: Array<string>) {
        let em_min = {
            val: +values[0],
            label: values[0],
        }
        let em_max = {
            val: +values[1],
            label: values[1],
        }

        // Check the unit and if necessary, convert to meters.
        const c = 299792458.0;
        if (this.unit === 'eV') {
            const h = 4.135667516*10e-15;
            em_min.val = h*c / em_min.val;
            em_max.val = h*c / em_max.val;
        } else if (this.unit === 'Hz') {
            em_min.val = c / em_min.val;
            em_max.val = c / em_max.val;
        }

        if (em_min.val > em_max.val) {
            const tmp = em_min;
            em_min = em_max;
            em_max = tmp;
        }

        let tagEmMin = this.tags.get('em_min');
        tagEmMin.value = em_min.val.toString();
        tagEmMin.repr = tagEmMin.operator + em_min.val.toExponential(3).toString() + ' m';

        let tagEmMax = this.tags.get('em_max');
        tagEmMax.value = em_max.val.toString();
        tagEmMax.repr = tagEmMax.operator + em_max.val.toExponential(3).toString() + ' m';

        this.tags.set('em_min', tagEmMin);
        this.tags.set('em_max', tagEmMax);

        this.$emit('updateFilterTags', this.tags);
    }
}
</script>

<style lang="scss">
$size-lang: 10px;
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

    #unit {
        width: 20%;
    }
}

</style>
