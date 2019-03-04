import { Vue } from 'vue-property-decorator';
import { Viewport } from './Viewport';
import { Tag } from './components/Filter.vue';
import { isNullOrUndefined } from 'util';

import WidgetComponent from './components/Widget.vue';

abstract class MOCServer {
    public static URL: string = 'http://alasky.unistra.fr/MocServer/query?';
    public static lastFilterEventUrl: string;

    public static query(url: string, caller: any, event: string, loading: boolean = true): void {
        if (event === 'filterTree') {
            // Register the time when the query is sent to the MOCServer
            MOCServer.lastFilterEventUrl = url;
        }
        console.log(url);
        /* Say to the caller component that a http request to the MOCServer is launched */
        if (loading) {
            caller.setLoading(true);
        }

        let promise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload = () => resolve(xhr.responseText);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

        promise.then((result) => {
            console.log('EVENT: ', event);
            // Check whether the last url sent corresponds to this one
            if (event !== 'filterTree') {
                MOCServer.callback(result as string, caller, event, loading);
            } else {
                // If a filter tree event has been launched
                // then lastFilterEventUrl is defined 
                if (url === MOCServer.lastFilterEventUrl) {
                    MOCServer.callback(result as string, caller, event, loading);
                }
            }
        }).catch(function(val) {
            console.log(val)
        });
    }

    public static callback(result: string, caller: any, event: string, loading: boolean = true) {
        // Parse the JSON to get an object
        const response = JSON.parse(result as string);
        // Send the result to the component that did the query
        caller.$root.$emit(event, response);
        if (loading) {
            caller.setLoading(false);
        }
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
        // If no filtering tags or if the filter is toggled off
        if (filter.size == 0 || !exclusion) {
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
                    let kw_url = encodeURIComponent('(obs_title=*' + kw + '*||obs_id=*' + kw + '*||obs_collection=*' + kw + '*||bib_reference=*' + kw + '*)');

                    if(j == 0) {
                        url += kw_url;
                    } else {
                        url += encodeURIComponent('&&') + kw_url;
                    }
                }
            } else {
                if (key === 't_min') {
                    url += '(t_max' + encodeURIComponent('>=') + encodeURIComponent(value) + '||t_max!=*)';
                } else if (key === 't_max') {
                    url += '(t_min' + encodeURIComponent('<=') + encodeURIComponent(value) + '||t_min!=*)';
                } else {
                    url += '(' + encodeURIComponent(key) + encodeURIComponent(operator) + encodeURIComponent(value) + '||' + encodeURIComponent(key) + '!=*' + ')';
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
