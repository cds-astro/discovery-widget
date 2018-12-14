import { Vue } from 'vue-property-decorator';
import { Viewport } from './Viewport';
import { Tag } from './components/Filter.vue';
import { isNullOrUndefined } from 'util';

import WidgetComponent from './components/Widget.vue';

abstract class MOCServer {
    public static URL: string = 'http://alasky.unistra.fr/MocServer/query?';

    public static query(url: string, caller: any, event: string, loading: boolean = true): void {
        console.log(url);
        /* Say to the caller component that a http request to the MOCServer is launched */
        if (loading) {
            caller.setLoading(true);
        }
        MOCServer.httpRequest(url, caller, event, loading);
    }

    private static callback(response: string, caller: any, event: string): void {
        // Parse the JSON to get an object
        const result = JSON.parse(response);
        // Send the result to the component that did the query
        caller.$root.$emit(event, result);
    }

    private static httpRequest(url: string, caller: any, event: string, loading: boolean): void {
        const xmlHttp = new XMLHttpRequest();
        // let bodyElement = document.getElementsByTagName("BODY")[0] as HTMLElement;
        // bodyElement.style.cursor = 'progress';

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                const response = xmlHttp.responseText;
                MOCServer.callback(response, caller, event);
                if (loading) {
                    caller.setLoading(false);
                }
                // Vue.js 2.0 does not support iterating through a HashMap.
                // This should be supported by Vue.js 3.0.
                // We currently have to use v-for="key in Array.from(map.keys())" + $forceUpdate the tree
                // each time an http request has been done
                // this.$forceUpdate();
                }
                // bodyElement.style.cursor = 'default';
            }
        };
        xmlHttp.open('GET', url, true); // true for asynchronous
        xmlHttp.send();
    }
}

// MOCServer query for retrieving the headers of the collections
// e.g. ID, obs_title, obs_id
export interface HeaderResponse {
    ID: string;
    obs_title: string;
    obs_id: string;
    client_category: string;
    dataproduct_type: string;
    vizier_popularity: number;
}

function firstLetterToUppercase(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

export function createDatasetName(dataset: HeaderResponse): {dataset: string, catalog: string} {
    let name = {
        dataset: '',
        catalog: '',
    };

    /* Specific dataset exceptions */
    if (dataset.ID === 'CDS/Simbad') {
        name.dataset = 'Simbad/Simbad';
        name.catalog = 'Simbad';
        return name;
    }
    
    const hasClientCategory = !isNullOrUndefined(dataset.client_category);

    if (!hasClientCategory) {
        let dataproduct_type = dataset.dataproduct_type;
        if (isNullOrUndefined(dataproduct_type)) {
            dataproduct_type = 'Others';
        }
        name.dataset = firstLetterToUppercase(dataproduct_type) + '/' + dataset.ID.split('/').slice(1).join('/');
        const end = name.dataset.lastIndexOf('/');
        name.catalog = name.dataset.substr(0, end);
    } else {
        name.catalog = dataset.client_category;
        let firstWord = name.catalog.split('/')[0];
        if (firstWord !== 'Image' && firstWord !== 'Catalog') {
            let dataproduct_type = dataset.dataproduct_type;
            if (isNullOrUndefined(dataproduct_type)) {
                dataproduct_type = 'Others';
            }
            name.catalog = firstLetterToUppercase(dataproduct_type) + '/' + name.catalog;
        }

        const end = dataset.ID.lastIndexOf('/');
        name.dataset = name.catalog + '/' + dataset.ID.substr(end + 1);
    }

    /* Replace P with Others */
    name.catalog = name.catalog.replace('/P/', '/Others/');
    name.dataset = name.dataset.replace('/P/', '/Others/');

    return name;
} 

export class TreeViewportMOCServerQuery extends MOCServer {
    public static getUrl(vp: Viewport): string {
        let url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type, vizier_popularity&' +
        'expr=(dataproduct_type=image,catalog)';
        url += vp ? '&' + vp.toString() : '';

        return url;
    }

    public static send(caller: any, vp: Viewport): void {
        const url = this.getUrl(vp);
        MOCServer.query(url, caller, 'viewportTree');
    }
}

export class TreeFilterMOCServerQuery extends MOCServer {
    public static getUrl(filter: Map<string, Array<Tag>>, exclusion: boolean): string {

        let url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type, vizier_popularity&' +
        'casesensitive=false';
        if (filter.size == 0) {
            return url;
        }

        url += '&expr='
        let i = 0;
        for (let [key, tags] of filter.entries()) {
                const operator = tags[0].operator;
                let values = [];
                tags.forEach(tag => {
                    values.push(tag.value);
                });
                let value = values.join(',');

                if(i > 0) {
                    url += encodeURIComponent('&&');
                }
                if(key === "keywords") {
                    const kws = value.split(' ');
                    for(let j = 0; j < kws.length; j++) {
                        let kw = kws[j];
                        if(j == 0) {
                            url += encodeURIComponent('(obs_title=*' + kw + '*||obs_id=*' + kw + '*||obs_collection=*' + kw + '*)');
                        } else {
                            url += encodeURIComponent('&&(obs_title=*' + kw + '*||obs_id=*' + kw + '*||obs_collection=*' + kw + '*)');
                        }
                    }
                } else {
                    url += '(' + encodeURIComponent(key) + encodeURIComponent(operator) + encodeURIComponent(value);
                
                    if (exclusion) {
                        url += ')';
                    } else {
                        url += '||' + encodeURIComponent(key) + '!=*' + ')';
                    }
                }
                i++;
            
        }

        console.log('FITLER URL', url);

        return url;
    }

    public static send(caller: any, filter: Map<string, Array<Tag>>, excludePlausibleCollection: boolean = false): void {
        const url = this.getUrl(filter, excludePlausibleCollection);
        MOCServer.query(url, caller, 'filterTree');
    }
}

export class RetrieveAllDatasetHeadersQuery extends MOCServer {
    public static getUrl(): string {
        const url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type, vizier_popularity&' +
        'expr=(dataproduct_type=image,catalog)';

        return url;
    }

    public static send(caller: any): void {
        const url = this.getUrl();
        MOCServer.query(url, caller, 'retrieveAllDatasetHeaders');
    }
}

// Query the MOCServer for retriving the whole record of a specific
// collection. Useful for popups.
export class RetrieveRecordCollectionQuery extends MOCServer {
    public static getUrl(id: string, fmt: string= 'json'): string {
        const url = MOCServer.URL +
        'get=record&' +
        'fmt=' + fmt + '&' +
        'expr=(ID=' + encodeURIComponent(id) + ')';

        return url;
    }

    public static send(caller: any, id: string): void {
        const url = this.getUrl(id);
        MOCServer.query(url, caller, 'retrieveRecordCollection', false);
    }
}
