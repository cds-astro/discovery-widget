<!-- src/components/Filter.vue -->

<template>
    <div id="filter">
        <div id="shower">
            <div ref="filter" @click="toggleFilterPanel" @mouseover="hoverFilterPanel" @mouseleave="leavingFilterPanel" id="icon">
                <i class="fa fa-filter"></i>
                <p>Filter</p>
                <TooltipComponent v-if="!excludePlausibleCollection">
                    <template slot="hover-element">
                        <toggle-button id="toggler" v-model="excludePlausibleCollection"
                            color="#3498db"
                            :sync="true"
                            :labels="true"/>
                    </template>

                    <template slot="content">
                        <p>Enable the filter</p>
                    </template>
                </TooltipComponent>
                <TooltipComponent v-else>
                    <template slot="hover-element">
                        <toggle-button id="toggler" v-model="excludePlausibleCollection"
                            color="#3498db"
                            :sync="true"
                            :labels="true"/>
                    </template>

                    <template slot="content">
                        <p>Disable the filter</p>
                    </template>
                </TooltipComponent>

                <p class="num-datasets" v-if="numRemainingDatasets > 0" :style="{color: 'green'}">{{ numRemainingDatasets }} / {{ numAllDatasets }} datasets</p>
                <p class="num-datasets" v-else :style="{color: 'red'}">{{ numRemainingDatasets }} / {{ numAllDatasets }} datasets</p>
            </div>
        </div>

        <div v-show="showForm" id="form">
            <QuitComponent v-on:quit="showForm=false"></QuitComponent>

            <div class="part">
                <div class="metadata">
                    <i class="fa fa-wifi"></i>
                    <label>Bandwidth :</label>

                    <multiselect 
                        class="pickbox" 
                        v-model="regime"
                        :options="bandwidthList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="radio, infrared, optical..."></multiselect>
                </div>

                <div class="metadata">
                    <i class="fa fa-calendar"></i>
                    <label>Date :</label>

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
                    <i style="width: 32px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg></i>
                    <label>Em :</label>

                    <vue-slider id="slider" ref="slider" v-model="em_value" @drag-end="changeEmValues($event.value)" v-bind="options" v-bind:width="'100%'"></vue-slider>
                    <select id="unit" v-on:change="changeEmUnit($event.target.value);">
                        <option>eV</option>
                        <option>Hz</option>
                        <option>m</option>
                    </select>
                    
                    <TooltipComponent :width="'504px'" :height="'385px'">
                        <template slot="hover-element">
                            <i class="fa fa-question-circle question-icon" style="font-size:24px"></i>
                        </template>

                        <template slot="content">
                            <img src="./../../images/A4C10.png" />
                        </template>
                    </TooltipComponent>
                </div>

                <div class="metadata">
                    <i class="fa fa-image"></i>
                    <label>Type :</label>

                    <ul class="checkbox-container">
                        <li>
                            <input ref="imageCheckbox" id="image-checkbox" type="checkbox" v-bind:disabled="disableImageCheckbox" checked="checked" @click="addDataTypeFilterTag('image', $event.target.checked)"><label>Image</label>
                        </li>
                        <li>
                            <input ref="catalogCheckbox" id="catalog-checkbox" type="checkbox" v-bind:disabled="disableCatalogCheckbox" checked="checked" @click="addDataTypeFilterTag('catalog', $event.target.checked)"><label>Catalog</label>
                        </li>
                    </ul>
                </div>
 
            </div>

            <div class="part">
                <h3>Catalogs only</h3>
                <div class="metadata">                    
                    <i class="fa fa-space-shuttle"></i>
                    <label>Mission :</label>

                    <multiselect v-model="mission"
                        :options="missionList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="Chandra, AKARI, ESO..."></multiselect>
                </div>

                <div class="metadata">
                    <i style="width: 32px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg></i>
                    <label>Astronomy :</label>

                    <multiselect v-model="astronomy"
                        :options="astronomyList"
                        :multiple="true"
                        :searchable="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        :preserve-search="true"
                        placeholder="AGN, ..."></multiselect>
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
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import ToggleButton from 'vue-js-toggle-button/src/Button.vue';

// Use v-calendar, v-date-picker & v-popover components
Vue.use(VCalendar, {
  firstDayOfWeek: 2,  // Monday
});

export class Tag {

    public operator: string;
    public value: string;
    public repr: string;
    constructor(operator: string, value: string, repr: string) {
        this.operator = operator;
        this.value = value;
        this.repr = repr;
    }
}

@Component({
    name: 'filter-tool',
    components: {
        QuitComponent,
        vueSlider,
        TooltipComponent,
        VCalendar,
        Multiselect,
        ToggleButton,
    },
})
export default class FilterComponent extends Vue {

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
        const h = 4.135667516 * 10e-15;

        return h * c / m;
    }

    private static convertEVToMeter(E: number): number {
        const c = 299792458.0;
        const h = 4.135667516 * 10e-15;

        return h * c / E;
    }

    private static convertFreqToEV(f: number): number {
        const h = 4.135667516 * 10e-15;
        return h * f;
    }

    private static convertEVToFreq(E: number): number {
        const h = 4.135667516 * 10e-15;
        return E / h;
    }

    @Prop() public numAllDatasets!: number;

    @Prop() public updatedTagsFromWidget!: Map<string, Tag[]>;

    @Prop() public numRemainingDatasets!: number;
    private tags: Map<string, Tag[]> = new Map<string, Tag[]>();

    private showForm: boolean = false;
    private showColor: string = 'white';
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
    };

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

    /* OBS_astronomy FILTERING */
    private astronomyList = [
        'Abundances',
        'Ages',
        'AGN',
        'Associations',
        'Asteroseismology',
        'Atomic_Data',
    ];
    private astronomy: string[] = [];

    /* OBS_REGIME FILTERING */
    private bandwidthList = [
        'Radio',
        'Infrared',
        'Millimeter',
        'Optical',
        'Gas-lines',
        'UV',
        'X',
        'Gamma-ray',
    ];
    private regime: string[] = [];

    /* EM_MIN/MAX FILTERING */
    private ticks: Map<string, string[]> = new Map<string, string[]>([
        ['eV', ['1e-9', '1e-7', '1e-5', '1e-3', '1e-1', '1e+1', '1e+3', '1e+5', '1e+7', '1e+9']],
        ['Hz', ['1e+5', '1e+7', '1e+9', '1e+11', '1e+13', '1e+15', '1e+17', '1e+19', '1e+21', '1e+23']],
        ['m', ['1e-13', '1e-11', '1e-9', '1e-7', '1e-5', '1e-3', '1e-1', '1e+1', '1e+3', '1e+5']],
    ]);
    private unit: string = 'eV';
    private em_value: string[] = ['1e-9', '1e+9'];

    private options = {
        value: this.em_value,
        dotSize: 14,
        min: 1,
        max: 100,
        disabled: false,
        tooltip: 'always',
        piecewise: true,
        data: this.ticks.get('eV'),
        formatter: '{value} eV',
    };

    /* DATAPRODUCT_TYPE FILTERING */
    private showImage: boolean = true;
    private showCatalog: boolean = true;
    private disableImageCheckbox: boolean = false;
    private disableCatalogCheckbox: boolean = false;

    private excludePlausibleCollection: boolean = true;
    @Watch('updatedTagsFromWidget')
    public changeTagsFromWidget(newTags: Map<string, Tag[]>, oldTags: Map<string, Tag[]>) {
        this.tags = newTags;

        // regime
        this.regime = [];
        const obs_regime = this.tags.get('obs_regime');
        if (!isNullOrUndefined(obs_regime)) {
            const repr = [];
            obs_regime.forEach((t) => {
                repr.push(t.repr);
            });
            this.regime = repr;
        }

        // mission
        this.mission = [];
        const obs_mission = this.tags.get('obs_mission');
        if (!isNullOrUndefined(obs_mission)) {
            const repr = [];
            obs_mission.forEach((t) => {
                repr.push(t.repr);
            });
            this.mission = repr;
        }

        // astronomy
        this.astronomy = [];
        const obs_astronomy_kw = this.tags.get('obs_astronomy_kw');
        if (!isNullOrUndefined(obs_astronomy_kw)) {
            const repr = [];
            obs_astronomy_kw.forEach((t) => {
                repr.push(t.repr);
            });
            this.astronomy = repr;
        }

        // t_min
        const t_min = this.tags.get('t_min');
        if (isNullOrUndefined(t_min)) {
            this.minDate = this.attributes.min[0].dates;
        }

        // t_max
        const t_max = this.tags.get('t_max');
        if (isNullOrUndefined(t_max)) {
            this.maxDate = this.attributes.max[0].dates;
        }

        // dataproduct_type
        const dataproduct_type = this.tags.get('dataproduct_type');
        if (isNullOrUndefined(dataproduct_type)) {
            (this.$refs.imageCheckbox as HTMLInputElement).checked = true;
            (this.$refs.catalogCheckbox as HTMLInputElement).checked = true;

            this.showImage = true;
            this.showCatalog = true;
            this.disableImageCheckbox = false;
            this.disableCatalogCheckbox = false;
        }
    }
    @Watch('showForm')
    public changeShowForm(val: boolean, oldVal: boolean) {
        if (val) {
            this.$nextTick(() => (this.$refs.slider as any).refresh());
        }
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
    @Watch('mission')
    public changeMissionPicker(newMissions: string[], old: string[]) {
        this.addMissionFilterTag(newMissions);
    }
    @Watch('astronomy')
    public changeAstroPicker(newAstronomys: string[], old: string[]) {
        this.addAstronomyFilterTag(newAstronomys);
    }
    @Watch('regime')
    public changeRegimePicker(newRegime: string[], oldRegime: string[]) {
        this.addRegimeFilterTag(newRegime);
    }
    @Watch('excludePlausibleCollection')
    public changePlausibleCollectionExclusion(excludePlausibleCollection: boolean, old: boolean) {
        this.excludePlausibleCollection = excludePlausibleCollection;

        this.$emit('excludePlausibleCollection', excludePlausibleCollection);
    }
    private addLowerBoundDateFilterTag(date: Date) {
        const tag_min = new Tag('>=', dateToMJD(date).toString(), '>= ' + date.toDateString());

        this.tags.set('t_min', [tag_min]);
        this.$emit('updateFilterTags', {
            key: 't_min',
            tags: [tag_min],
        });
    }

    private toggleFilterPanel() {
        this.showForm = !this.showForm;
        if (this.showForm) {
            this.showColor = 'gainsboro';

        } else {
            this.showColor = 'white';
        }

        this.$refs.filter['style'].backgroundColor = this.showColor;

        // this.$el.backgroundColor = this.showColor;
    }

    private hoverFilterPanel() {
        if (!this.showForm) {
            this.$refs.filter['style'].backgroundColor = 'gainsboro';
        }
    }

    private leavingFilterPanel() {
        if (!this.showForm) {
            this.$refs.filter['style'].backgroundColor = 'white';
        }
    }


    private setHoverColor() {
        this.showColor = 'gainsboro';
    }

    private addUpperBoundDateFilterTag(date: Date) {
        const tag_max = new Tag('<=', dateToMJD(date).toString(), '<= ' + date.toDateString());

        this.tags.set('t_max', [tag_max]);
        this.$emit('updateFilterTags', {
            key: 't_max',
            tags: [tag_max],
        });
    }

    private addMissionFilterTag(newMissions: string[]) {
        const tags = [];

        newMissions.forEach((mission) => {
            const value = '*' + mission + '*';
            const repr = mission;
            const operator = '=';

            const newMissionTag = new Tag(operator, value, repr);
            tags.push(newMissionTag);
        });

        this.tags.set('obs_mission', tags);

        this.$emit('updateFilterTags', {
            key: 'obs_mission',
            tags,
        });
    }

    private addAstronomyFilterTag(newAstronomys: string[]) {
        const tags = [];

        newAstronomys.forEach((astro) => {
            const value = '*' + astro + '*';
            const repr = astro;
            const operator = '=';

            const newAstroTag = new Tag(operator, value, repr);
            tags.push(newAstroTag);
        });

        this.tags.set('obs_astronomy_kw', tags);

        this.$emit('updateFilterTags', {
            key: 'obs_astronomy_kw',
            tags,
        });
    }

    private addRegimeFilterTag(regimes: string[]) {
        const tags = [];

        regimes.forEach((regime) => {
            const value = '*' + regime + '*';
            const repr = regime;
            const operator = '=';

            const newRegimeTag = new Tag(operator, value, repr);
            tags.push(newRegimeTag);
        });

        this.tags.set('obs_regime', tags);

        this.$emit('updateFilterTags', {
            key: 'obs_regime',
            tags,
        });
    }
    private changeEmValues(em_value: string[]) {
        this.em_value = em_value;
        this.addEmFilterTag(em_value);
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
        } else if (this.unit === 'Hz') {
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
        this.changeEmValues([a.toString(), b.toString()]);

        this.options.data = this.ticks.get(unit);
        this.options.value = this.em_value;
        this.options.formatter = '{value} ' + unit;
    }

    private addEmFilterTag(em_value: string[]) {
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

        const tagEmMin = new Tag('>=', '', '');
        tagEmMin.value = em_min.toString();
        if (this.unit === 'eV' || this.unit === 'Hz') {
            tagEmMin.repr = '<=' + em_min_unit.toExponential(3).toString() + ' ' + this.unit;
        } else {
            tagEmMin.repr = '>=' + em_min_unit.toExponential(3).toString() + ' ' + this.unit;
        }

        const tagEmMax = new Tag('<=', '', '');
        tagEmMax.value = em_max.toString();
        tagEmMax.repr = tagEmMax.operator + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        if (this.unit === 'eV' || this.unit === 'Hz') {
            tagEmMax.repr = '>=' + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        } else {
            tagEmMax.repr = '<=' + em_max_unit.toExponential(3).toString() + ' ' + this.unit;
        }

        const ticks = this.ticks.get(this.unit);
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
            const tagDataproductType = new Tag('=', '*', '');
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

#filter #shower {
    border-top: 1px solid gainsboro;


    #icon {
        padding: 10px;
        flex: 1;
        text-align: center;
        * {
            display: inline-block;
        }

        p {
            margin: 0px 5px;
        }

        p.num-datasets {
            color: green;
        }
    }
}

#filter #icon:hover {
    //background-color: gainsboro;
    cursor: pointer;
}

#filter #form {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translate($size-lang, -$size-lang) translateY(-$pos-y-lang);

    background-color: white;
    width: 400px;
    padding: 0px 10px;
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
    h3 {
        padding: 10px 0px;
        border-bottom: 2px solid gainsboro;
    }

    .metadata > * {
        margin-right: 5px;
    }

    .metadata {
        //height: 80px;
        padding: 7px 10px;
        display: flex;

        align-items: center;

        border-top: 1px solid gainsboro;

        .pickbox {
            min-height:20px;
        }

        i {
            font-size: 20px;
        }

        label {
            white-space:nowrap;
        }

        #slider {
            z-index: 0;
            width: 100%;
        }

        select {
            background-color: whitesmoke;
            outline: none;
            padding: 5px 5px;
            border: 1px solid gainsboro;
            border-radius: 4px;

            margin: 0px 5px;
        }

        .multiselect__tag, .multiselect__option--highlight, .multiselect__option--highlight:after {
            background-color: #3498db;
        }

        .multiselect__select {
            background-color: gainsboro;
            padding: 5px;
            z-index: auto;
        }

        .input-date {
            color: black;

            padding: 10px;

            border-radius: 5px;
            border: 1px solid #e8e8e8;
            background: #fff;
            font-size: 14px;

            width: 100%;
        }

        ul.checkbox-container {
            padding: 0;
            width: 100%;
            
            li {
                list-style-type: none;
                display: inline-block;
                margin-right: 10px; 

                /*** custom checkboxes ***/
                input[type=checkbox] {
                    position: relative;
                    width: auto;
                }
                /* to hide the checkbox itself */
                input[type=checkbox]:before {
                    position: absolute;
                    background-color: #FFFFFF;
                    height: 100%;
                    width: 100%;
                    font-family: FontAwesome;
                    font-size: 15px;
                    display: inline-block;
                    content:"\f096";
                }
                /* space between checkbox and label */
                input[type=checkbox]:checked:before {
                    font-family: FontAwesome;
                    display: inline-block;
                    content:"\f046";
                }
            }
        }
    }
}

</style>
