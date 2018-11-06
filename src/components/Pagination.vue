<!-- src/components/Pagination.vue -->

<template>
    <div id="page-component">
        <button v-on:click="prevPage()">
            prev
        </button>
        <button v-on:click="nextPage()">
            next
        </button>
        <select v-model="numCollectionsPerPage">
            <option disabled value="">Choisissez</option>
            <option>10</option>
            <option>20</option>
            <option>50</option>
        </select>
        <p>({{ numCollections }}) page {{ currentPage + 1 }}/{{ maxNumPage }}</p>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator';

@Component({
    name: 'page-component',
})
export default class PaginationComponent extends Vue {
    @Prop() public numCollections!: number;

    private numCollectionsPerPage: number = 50;

    private currentPage: number = 0;
    private maxNumPage: number = 1;

    public mounted() {
        console.log('Pagination component MOUNTED');
        this.updatePagination();
    }
    @Watch('numCollections')
    private onChangedCollections(val: number, oldVal: number) {
        console.log('on changed collections');
        this.computeMaxNumPage();
    }
    @Watch('numCollectionsPerPage')
    private onChangedNumCollectionsPerPage(val: number, oldVal: number) {
        console.log('on changed num collections');
        this.computeMaxNumPage();
    }

    private computeMaxNumPage() {
        const d = this.numCollections / this.numCollectionsPerPage;
        const t = Math.floor(d);
        this.maxNumPage = d == t ? Math.max(t, 1) : t + 1;
        console.log('max number of pages', this.maxNumPage, this.numCollections);
        if (this.currentPage >= this.maxNumPage) {
            this.currentPage = this.maxNumPage - 1;
        }
        this.updatePagination();
    }

    private nextPage(): void {
        this.currentPage += 1;
        if (this.currentPage >= this.maxNumPage) {
            this.currentPage = this.maxNumPage - 1;
        }
        this.updatePagination();
    }

    private prevPage(): void {
        this.currentPage -= 1;
        this.currentPage = this.currentPage < 0 ? 0 : this.currentPage;
        this.updatePagination();
    }

    private updatePagination() {
        const sliceBounds = [
            this.currentPage * this.numCollectionsPerPage,
            (this.currentPage + 1) * this.numCollectionsPerPage,
        ];

        console.log('update pagination', sliceBounds);
        this.$emit('pagination',
            sliceBounds,
        );
    }
}
</script>

<style>
</style>
