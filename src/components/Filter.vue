<!-- src/components/Filter.vue -->

<template>
    <div id="filter">
        <div @click="showForm = !showForm" id="icon">
            <i class="fas fa-filter"></i>
            <p>Filter</p>
        </div>
        <div v-show="showForm" id="form">
            <QuitComponent v-on:quit="showForm=false"></QuitComponent>

            <div class="metadata">
                <div class="header">
                    <i class="fa fa-wifi fa-1x"></i>
                    <p>Bandwidth</p>
                </div>
                
                <select ref="regimeSelector" v-on:change="addFilterTag($event.target.value, 'obs_regime')">
                    <option value="">Select bandwidth</option>
                    <option v-for="i in bandwidthList.length">{{ bandwidthList[i - 1] }}</option>
                </select>
            </div>

            <div class="metadata">
                <div class="header">
                    <i class="fa fa-calendar"></i>
                    <p>Date</p>
                </div>
                
                <v-date-picker
                    :available-dates='{ start: attributes.min[0].dates, end: maxDate }'
                    :input-props='{ class: "input-date", placeholder: "Lower-bound date" }'
                    mode='single'
                    v-model="minDate"
                    :attributes="attributes.min"
                    show-caps></v-date-picker>
                <v-date-picker
                    :available-dates='{ start: minDate, end: new Date() }'
                    :input-props='{ class: "input-date", placeholder: "Upper-bound date" }'
                    v-model="maxDate"
                    mode='single'
                    :attributes="attributes.max"
                    show-caps></v-date-picker>
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
                <ul class="checkbox-container">
                    <li>
                        <input ref="imageCheckbox" id="image-checkbox" type="checkbox" v-bind:disabled="disableImageCheckbox" checked="checked" @click="addDataTypeFilterTag('image', $event.target.checked)">
                        <label for="image-checkbox">Image</label>
                    </li>
                    <li>
                        <input ref="catalogCheckbox" id="catalog-checkbox" type="checkbox" v-bind:disabled="disableCatalogCheckbox" checked="checked" @click="addDataTypeFilterTag('catalog', $event.target.checked)">
                        <label for="catalog-checkbox">Catalog</label>
                    </li>
                </ul>
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
import vueSlider from 'vue-slider-component';
import { dateToMJD } from './../utils';
import { isNullOrUndefined, isNull } from 'util';
import VCalendar from 'v-calendar';
import 'v-calendar/lib/v-calendar.min.css';

// Use v-calendar, v-date-picker & v-popover components
Vue.use(VCalendar, {
  firstDayOfWeek: 2,  // Monday
});

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
        vueSlider,
        TooltipComponent,
        VCalendar,
    },
})
export default class FilterComponent extends Vue {
    @Prop() deletedTag!: string;
    @Watch('deletedTag')
    public deleteTag(key: string, oldKey: string) {
        let d = this.defaultTags.get(key);
        if (isNullOrUndefined(d)) {
            return;
        }

        this.tags.set(key, new Tag(d.operator, d.value, d.repr));

        switch (key) {
            case 'obs_regime': {
                (this.$refs.regimeSelector as HTMLSelectElement).value = '';
                break;
            }
            case 't_min': {
                let dateMax = new Date(this.attributes.max[0].dates);
                this.attributes.max[0].dates = dateMax;
                break;
            }
            case 't_max': {
                let dateMin = new Date(this.attributes.min[0].dates);
                this.attributes.min[0].dates = dateMin;
                break;
            }
            case 'dataproduct_type': {
                (this.$refs.imageCheckbox as HTMLInputElement).checked = true;
                (this.$refs.catalogCheckbox as HTMLInputElement).checked = true;

                this.showImage = true;
                this.showCatalog = true;
                this.disableImageCheckbox = false;
                this.disableCatalogCheckbox = false;
                break;
            }
        }
    }

    private showForm: boolean = false;
    @Watch('showForm')
    public changeShowForm(val: boolean, oldVal: boolean) {
        if(val) {
            this.$nextTick(() => (this.$refs.slider as any).refresh());
        }
    }

    private attributes = {
        min: [{
            key: 'today',
            dates: new Date(1970, 0, 1),
        }],
        max: [{
            key: 'today',
            dates: new Date(),
        }],
    }

    private minDate: Date = new Date(1970, 0, 1);
    @Watch('minDate')
    public changeMinDatePicker(date: Date, oldDate: Date) {
        this.addDateFilterTag(date, 't_min');
    }
    private maxDate: Date = new Date();
    @Watch('maxDate')
    public changeMaxDatePicker(date: Date, oldDate: Date) {
        this.addDateFilterTag(date, 't_max');
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

    private showImage: boolean = true;
    private showCatalog: boolean = true;
    private disableImageCheckbox: boolean = false;
    private disableCatalogCheckbox: boolean = false;

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
        'Radio',
        'Infrared',
        'Optical',
        'Gas-lines',
        'UV',
        'X',
        'Gamma-ray',
    ];
    private defaultTags: Map<string, Tag> = new Map<string, Tag>([
        ['obs_regime', new Tag('=', '*', '')],
        ['dataproduct_type', new Tag('=', '*', '')],
        ['t_min', new Tag('<=', dateToMJD(this.attributes.max[0].dates).toString(), '')],
        ['t_max', new Tag('>=', dateToMJD(this.attributes.min[0].dates).toString(), '')],
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
            nextTag = new Tag(currentTag.operator, '*' + val + '*', val);
        }

        this.tags.set(key, nextTag);
        
        this.$emit('updateFilterTags', {
            key: key,
            tag: nextTag,
        });
    }

    private addDateFilterTag(val: Date, key: string) {
        let tag_min = this.tags.get('t_min');
        let tag_max = this.tags.get('t_max');

        console.log('DATE', val);

        if (key === 't_min') {
            tag_max.value = dateToMJD(val).toString();
            tag_max.repr = tag_max.operator + val.toDateString();
        } else {
            tag_min.value = dateToMJD(val).toString();
            tag_min.repr = tag_min.operator + val.toDateString();
        }

        this.tags.set('t_min', tag_min);
        this.tags.set('t_max', tag_max);

        this.$emit('updateFilterTags', {
            key: 't_min',
            tag: tag_min,
        });
        this.$emit('updateFilterTags', {
            key: 't_max',
            tag: tag_max,
        });
    }

    private changeEmUnit(unit: string) {
        this.unit = unit;

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

        this.$emit('updateFilterTags', {
            key: 'em_min',
            tag: tagEmMin,
        });
        this.$emit('updateFilterTags', {
            key: 'em_max',
            tag: tagEmMax,
        });
    }

    private addDataTypeFilterTag(type: string, checked: boolean) {
        if (type === 'image' && !this.disableImageCheckbox) {
            this.showImage = checked;
            if (!this.showImage) {
                this.disableCatalogCheckbox = true;
            }
        } else if (type === 'catalog' && !this.disableCatalogCheckbox) {
            this.showCatalog = checked;
            if (!this.showCatalog) {
                this.disableImageCheckbox = true;
            }
        }

        let tagDataproductType = this.tags.get('dataproduct_type');

        if (this.showCatalog && this.showImage) {
            tagDataproductType.value = '*';
            tagDataproductType.repr = '';

            this.disableCatalogCheckbox = false;
            this.disableImageCheckbox = false;
        } else {
            if (this.showCatalog) {
                tagDataproductType.value = 'catalog';
                tagDataproductType.repr = 'catalog';
            } else if (this.showImage) {
                tagDataproductType.value = 'image';
                tagDataproductType.repr = 'image';
            }
        }

        this.tags.set('dataproduct_type', tagDataproductType);

        this.$emit('updateFilterTags', {
            key: 'dataproduct_type',
            tag: tagDataproductType,
        });
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

    * {
        display: inline;
    }

    p {
        margin: 0px 5px;
    }
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
    //justify-content: space-around;
    align-items: center;

    border-bottom: 1px solid gainsboro;

    div.header, select, input, #unit, ul {
        margin: 0px 3px;
    }

    .input-date {
        color: gray;
        padding: 5px;
        border-radius: 2px;
        width: 90%;
        border: 1px solid gray;
    }

    div.header {
        display: flex;
        
        align-items: center;

        * {
            margin: 0px 3px;
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

    ul.checkbox-container {
        li {
            display: inline-block;

            * {
                display: inline-block;
            }
        }
    }
}

</style>
