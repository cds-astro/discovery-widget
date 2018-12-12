<!-- src/components/Filter.vue -->

<template>
    <div id="filter">
        <div @click="showForm = !showForm" id="icon">
            <i class="fas fa-filter"></i>
            <p>Filter</p>
            <p class="num-datasets" v-if="numRemainingDatasets > 0" :style="{color: 'green'}">({{ numRemainingDatasets }}) datasets</p>
            <p class="num-datasets" v-else :style="{color: 'red'}">({{ numRemainingDatasets }}) datasets</p>

        </div>
        <div v-show="showForm" id="form">
            <QuitComponent v-on:quit="showForm=false"></QuitComponent>

            <div class="part">
                <h3>Global</h3>
                <div class="metadata">
                    <div class="header">
                        <i class="fas fa-wifi"></i>
                        <p>Bandwidth</p>
                    </div>
                    <multiselect class="multisct" v-model="regime"
                        :options="bandwidthList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="Pick one or several regimes"></multiselect>
                </div>

                <div class="metadata">
                    <div class="header">
                        <i class="fas fa-calendar"></i>
                        <p>Date</p>
                    </div>
                    
                    <v-date-picker
                        :available-dates='{ start: attributes.min[0].dates, end: maxDate }'
                        :input-props='{ class: "input-date", placeholder: "Lower-bound date" }'
                        mode='single'
                        v-model="minDate"
                        :attributes="attributes.min"
                        show-caps></v-date-picker>
                    <p>to</p>
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
                    <vue-slider ref="slider" v-model="em_value" v-bind="options" v-bind:width="'100%'"></vue-slider>
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
            </div>

            
            <div class="part">
                <h3>Catalogs only</h3>
                <div class="metadata">
                    <div class="header">
                        <i class="fas fa-space-shuttle"></i>
                        <p>Mission</p>
                    </div>
                    <multiselect class="multisct" v-model="mission"
                        :options="missionList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="Pick one or several missions"></multiselect>
                </div>

                <div class="metadata">
                    <div class="header">
                        <i class="fas fa-satellite"></i>
                        <p>Astronomy</p>
                    </div>
                    <multiselect v-model="astronomy"
                        :options="astronomyList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="Pick one or several optical astronomys"></multiselect>
                </div>
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
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css';

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

@Component({
    name: 'filter',
    components: {
        QuitComponent,
        vueSlider,
        TooltipComponent,
        VCalendar,
        Multiselect,
    },
})
export default class FilterComponent extends Vue {
    public mounted() {
        console.log('Filter component MOUNTED');
    }
    /*private defaultTags: Map<string, Array<Tag>> = new Map<string, Array<Tag>>([
        ['obs_regime', [new Tag('=', '*', '')]],
        ['dataproduct_type', [new Tag('=', '*', '')]],
        ['t_min', [new Tag('<=', dateToMJD(this.attributes.max[0].dates).toString(), '')]],
        ['t_max', [new Tag('>=', dateToMJD(this.attributes.min[0].dates).toString(), '')]],
        ['em_min', [new Tag('>=', '1E-13', '')]],
        ['em_max', [new Tag('<=', '1E4', '')]],
    ]);*/
    private tags: Map<string, Array<Tag>> = new Map<string, Array<Tag>>();

    @Prop() updatedTagsFromWidget!: Map<string, Array<Tag>>;
    @Watch('updatedTagsFromWidget')
    public changeTagsFromWidget(newTags: Map<string, Array<Tag>>, oldTags: Map<string, Array<Tag>>) {
        this.tags = newTags;

        // regime
        this.regime = [];
        let obs_regime = this.tags.get('obs_regime');
        if (!isNullOrUndefined(obs_regime)) {
            let repr = [];
            obs_regime.forEach(t => {
                repr.push(t.repr);
            });
            this.regime = repr;
        }

        // mission
        this.mission = [];
        let obs_mission = this.tags.get('obs_mission');
        if (!isNullOrUndefined(obs_mission)) {
            let repr = [];
            obs_mission.forEach(t => {
                repr.push(t.repr);
            });
            this.mission = repr;
        }

        // astronomy
        this.astronomy = [];
        let obs_astronomy_kw = this.tags.get('obs_astronomy_kw');
        if (!isNullOrUndefined(obs_astronomy_kw)) {
            let repr = [];
            obs_astronomy_kw.forEach(t => {
                repr.push(t.repr);
            });
            this.astronomy = repr;
        }

        // t_min
        let t_min = this.tags.get('t_min');
        if (isNullOrUndefined(t_min)) {
            this.minDate = this.attributes.min[0].dates;
        }

        // t_max
        let t_max = this.tags.get('t_max');
        if (isNullOrUndefined(t_max)) {
            this.maxDate = this.attributes.max[0].dates;
        }

        // dataproduct_type
        let dataproduct_type = this.tags.get('dataproduct_type');
        if (isNullOrUndefined(dataproduct_type)) {
            (this.$refs.imageCheckbox as HTMLInputElement).checked = true;
            (this.$refs.catalogCheckbox as HTMLInputElement).checked = true;

            this.showImage = true;
            this.showCatalog = true;
            this.disableImageCheckbox = false;
            this.disableCatalogCheckbox = false;
        }
    }

    @Prop() numRemainingDatasets!: number;

    private showForm: boolean = false;
    @Watch('showForm')
    public changeShowForm(val: boolean, oldVal: boolean) {
        if(val) {
            this.$nextTick(() => (this.$refs.slider as any).refresh());
        }
    }

    /* TMIN/TMAX FILTERING */
    private minDate: Date = new Date(1970, 0, 1);
    private maxDate: Date = new Date();
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
    @Watch('minDate')
    public changeMinDatePicker(date: Date, oldDate: Date) {
        if (date !== this.attributes.min[0].dates) {
            this.addLowerBoundDateFilterTag(date);
        }
    }

    @Watch('maxDate')
    public changeMaxDatePicker(date: Date, oldDate: Date) {
        if (date !== this.attributes.max[0].dates) {
            this.addUpperBoundDateFilterTag(date);
        }
    }
    private addLowerBoundDateFilterTag(date: Date) {
        let tag_min = new Tag('>=', dateToMJD(date).toString(), '>= ' + date.toDateString());
    
        this.tags.set('t_min', [tag_min]);
        this.$emit('updateFilterTags', {
            key: 't_min',
            tags: [tag_min],
        });
    }

    private addUpperBoundDateFilterTag(date: Date) {
        let tag_max = new Tag('<=', dateToMJD(date).toString(), '<= ' + date.toDateString());

        this.tags.set('t_max', [tag_max]);
        this.$emit('updateFilterTags', {
            key: 't_max',
            tags: [tag_max],
        });
    }

    /* OBS_MISSION FILTERING */
    private missionList = [
        'AKARI',
        'ANS',
        'ASCA',
        'BeppoSAX',
        'CGRO',
        'Chandra',
        'COBE',
        'Copernicus',
        'CoRoT',
        'Einstein',
        'ESO',
        'EUVE',
        'EXOSAT',
    ];
    private mission: string[] = [];
    @Watch('mission')
    public changeMissionPicker(newMissions: string[], old: string[]) {
        this.addMissionFilterTag(newMissions);
    }

    private addMissionFilterTag(newMissions: string[]) {
        let tags = [];

        newMissions.forEach(mission => {
            const value = '*' + mission + '*';
            const repr = mission;
            const operator = '=';
            
            let newMissionTag = new Tag(operator, value, repr);
            tags.push(newMissionTag);
        });

        this.tags.set('obs_mission', tags);
        
        this.$emit('updateFilterTags', {
            key: 'obs_mission',
            tags: tags,
        });
    }

    /* OBS_astronomy FILTERING */
    private astronomyList = [
        'Abundances',
        'Ages',
        'AGN',
        'Associations',
        'Asteroseismology',
        'Atomic_Data'
    ];
    private astronomy: string[] = [];
    @Watch('astronomy')
    public changeAstroPicker(newAstronomys: string[], old: string[]) {
        this.addAstronomyFilterTag(newAstronomys);
    }

    private addAstronomyFilterTag(newAstronomys: string[]) {
        let tags = [];

        newAstronomys.forEach(astro => {
            const value = '*' + astro + '*';
            const repr = astro;
            const operator = '=';
            
            let newAstroTag = new Tag(operator, value, repr);
            tags.push(newAstroTag);
        });

        this.tags.set('obs_astronomy_kw', tags);
        
        this.$emit('updateFilterTags', {
            key: 'obs_astronomy_kw',
            tags: tags,
        });
    }

    /* OBS_REGIME FILTERING */
    private bandwidthList = [
        'Radio',
        'Infrared',
        'Optical',
        'Gas-lines',
        'UV',
        'X',
        'Gamma-ray',
    ];
    private regime: string[] = [];
    @Watch('regime')
    public changeRegimePicker(newRegime: string[], oldRegime: string[]) {
        this.addRegimeFilterTag(newRegime);
    }

    private addRegimeFilterTag(regimes: string[]) {
        let tags = [];

        regimes.forEach(regime => {
            const value = '*' + regime + '*';
            const repr = regime;
            const operator = '=';
            
            let newRegimeTag = new Tag(operator, value, repr);
            tags.push(newRegimeTag);
        });

        this.tags.set('obs_regime', tags);
        
        this.$emit('updateFilterTags', {
            key: 'obs_regime',
            tags: tags,
        });
    }

    /* EM_MIN/MAX FILTERING */
    private ticks: Map<string, Array<string>> = new Map<string, Array<string>>([
        ['eV', ["1e-9", "1e-7", "1e-5", "1e-3", "1e-1", "1e+1", "1e+3", "1e+5", "1e+7", "1e+9"]],
        ['Hz', ["1e+5", "1e+7", "1e+9", "1e+11", "1e+13", "1e+15", "1e+17", "1e+19", "1e+21", "1e+23"]],
        ['m', ["1e-13", "1e-11", "1e-9", "1e-7", "1e-5", "1e-3", "1e-1", "1e+1", "1e+3", "1e+5"]],
    ]);
    private unit: string = 'eV';
    private em_value: Array<string> = ["1e-9", "1e+9"];
    @Watch('em_value')
    public pickNewEmValues(em_value: string[], old: string[]) {
        this.em_value = em_value;
        console.log('CHANGE EM');
        this.addEmFilterTag(em_value);
    }

    private options = {
        value: this.em_value,
        dotSize: 14,
        min: 1,
        max: 100,
        disabled: false,
        tooltip: "always",
        piecewise: true,
        data: this.ticks.get('eV'),
        formatter: "{value} eV",
    }

    private changeEmUnit(unit: string) {
        /* Convert to the new selected unit */
        let a = +this.em_value[0];
        let b = +this.em_value[1];

        if (this.unit === 'eV') {
            if (unit === 'm') {
                a = FilterComponent.convertEVToMeter(a);
                b = FilterComponent.convertEVToMeter(b);
            } else {
                a = FilterComponent.convertEVToFreq(a);
                b = FilterComponent.convertEVToFreq(b);
            }
        } else if(this.unit === 'Hz') {
            if (unit === 'm') {
                a = FilterComponent.convertFreqToMeter(a);
                b = FilterComponent.convertFreqToMeter(b);
            } else {
                a = FilterComponent.convertFreqToEV(a);
                b = FilterComponent.convertFreqToEV(b);
            }
        } else {
            if (unit === 'Hz') {
                a = FilterComponent.convertMeterToFreq(a);
                b = FilterComponent.convertMeterToFreq(b);
            } else {
                a = FilterComponent.convertMeterToEV(a);
                b = FilterComponent.convertMeterToEV(b);
            }
        }

        if (a > b) {
            const tmp = a;
            a = b;
            b = tmp;
        }

        this.unit = unit;
        this.em_value = [a.toString(), b.toString()];

        this.options.data = this.ticks.get(unit);
        this.options.value = this.em_value;
        this.options.formatter = "{value} " + unit;
    }

    private static convertMeterToFreq(m: number): number {
        const c = 299792458.0;
        return c / m;
    }

    private static convertFreqToMeter(f: number): number {
        const c = 299792458.0;
        return c / f;
    }

    private static convertMeterToEV(m: number): number {
        const c = 299792458.0;
        const h = 4.135667516*10e-15;

        return h * c / m;
    }

    private static convertEVToMeter(E: number): number {
        const c = 299792458.0;
        const h = 4.135667516*10e-15;

        return h * c / E;
    }

    private static convertFreqToEV(f: number): number {
        const h = 4.135667516*10e-15;
        return h * f;
    }

    private static convertEVToFreq(E: number): number {
        const h = 4.135667516*10e-15;
        return E / h;
    }

    private addEmFilterTag(em_value: Array<string>) {
        let em_min_unit = +em_value[0];
        let em_max_unit = +em_value[1];

        // Check the unit and if necessary, convert to meters.
        let em_min = +em_value[0];
        let em_max = +em_value[1];

        const c = 299792458.0;
        if (this.unit === 'eV') {
            em_min = FilterComponent.convertEVToMeter(em_min);
            em_max = FilterComponent.convertEVToMeter(em_max);
        } else if (this.unit === 'Hz') {
            em_min = FilterComponent.convertFreqToMeter(em_min);
            em_max = FilterComponent.convertFreqToMeter(em_max);
        }

        if (em_min > em_max) {
            const tmp = em_min;
            em_min = em_max;
            em_max = tmp;

            const tmp_unit = em_min_unit;
            em_min_unit = em_max_unit;
            em_max_unit = tmp_unit;
        }

        let tagEmMin = new Tag('>=', '', '');
        tagEmMin.value = em_min.toString();
        if (this.unit === 'eV' || this.unit === 'Hz') {
            tagEmMin.repr = '<=' + em_min_unit.toExponential(3).toString() + ' ' + this.unit;
        } else {
            tagEmMin.repr = '>=' + em_min_unit.toExponential(3).toString() + ' ' + this.unit;
        }

        let tagEmMax = new Tag('<=', '', '');
        tagEmMax.value = em_max.toString();
        tagEmMax.repr = tagEmMax.operator + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        if (this.unit === 'eV' || this.unit === 'Hz') {
            tagEmMax.repr = '>=' + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        } else {
            tagEmMax.repr = '<=' + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        }

        let ticks = this.ticks.get(this.unit);
        if (em_value[0] !== ticks[0]) {
            if (this.unit === 'eV' || this.unit === 'Hz') {
                this.tags.set('em_max', [tagEmMax]);
                this.$emit('updateFilterTags', {
                    key: 'em_max',
                    tags: [tagEmMax],
                });
            } else {
                this.tags.set('em_min', [tagEmMin]);
                this.$emit('updateFilterTags', {
                    key: 'em_min',
                    tags: [tagEmMin],
                });
            }
        } else {
            if (this.unit === 'eV' || this.unit === 'Hz') {
                this.tags.delete('em_max');
                this.$emit('updateFilterTags', {
                    key: 'em_max',
                    tags: [],
                });
            } else {
                this.tags.delete('em_min');
                this.$emit('updateFilterTags', {
                    key: 'em_min',
                    tags: [],
                });
            }
        }

        if (em_value[1] !== ticks[ticks.length - 1]) {
            if (this.unit === 'eV' || this.unit === 'Hz') {
                this.tags.set('em_min', [tagEmMin]);
                this.$emit('updateFilterTags', {
                    key: 'em_min',
                    tags: [tagEmMin],
                });
            } else {
                this.tags.set('em_max', [tagEmMax]);
                this.$emit('updateFilterTags', {
                    key: 'em_max',
                    tags: [tagEmMax],
                });
            }
        } else {
            if (this.unit === 'eV' || this.unit === 'Hz') {
                this.tags.delete('em_min');
                this.$emit('updateFilterTags', {
                    key: 'em_min',
                    tags: [],
                });
            } else {
                this.tags.delete('em_max');
                this.$emit('updateFilterTags', {
                    key: 'em_max',
                    tags: [],
                });
            }
        }
    }

    /* DATAPRODUCT_TYPE FILTERING */
    private showImage: boolean = true;
    private showCatalog: boolean = true;
    private disableImageCheckbox: boolean = false;
    private disableCatalogCheckbox: boolean = false;

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

        if (this.showCatalog && this.showImage) {
            this.disableCatalogCheckbox = false;
            this.disableImageCheckbox = false;

            this.$emit('updateFilterTags', {
                key: 'dataproduct_type',
                tags: [],
            });
        } else {
            let tagDataproductType = new Tag('=', '*', '');
            if (this.showCatalog) {
                tagDataproductType.value = 'catalog';
                tagDataproductType.repr = 'catalog';
            } else if (this.showImage) {
                tagDataproductType.value = 'image';
                tagDataproductType.repr = 'image';
            }

            this.tags.set('dataproduct_type', [tagDataproductType]);

            this.$emit('updateFilterTags', {
                key: 'dataproduct_type',
                tags: [tagDataproductType],
            });
        }
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

    * {
        display: inline;
    }

    p {
        margin: 0px 5px;
    }

    p.num-datasets {
        float: right;
        color: green;
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
    

    
    transform: translate($size-lang, -$size-lang) translateY(-$pos-y-lang);

    background-color: white;
    border: 1px solid gray;
    width: 450px;
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

#filter #form .part {
    border-bottom: 2px solid gainsboro;
    margin: 0px 5px;

    padding: 5px;

    h3 {
        padding-bottom: 5px;
    }

    .metadata {
        padding: 25px 10px;
        display: flex;
        //justify-content: space-around;
        align-items: center;

        border-top: 1px solid gainsboro;

        .multisct {
            z-index: 6;
        }

        .multiselect__tag, .multiselect__option--highlight, .multiselect__option--highlight:after {
            background-color: #3498db;
        }

        .multiselect__select {
            background-color: gainsboro;
        }

        p {
            margin: 0px 5px;
        }
        .input-date {
            color: gray;

            padding: 5px 0px;

            border-radius: 5px;
            border: 1px solid #e8e8e8;
            background: #fff;
            font-size: 14px;
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
}

</style>
