import { Vue } from 'vue-property-decorator';
import { Viewport } from './Viewport';

abstract class MOCServer {
    public static URL: string = 'http://alasky.unistra.fr/MocServer/query?';

    public static query(url: string, caller: any, event: string): void {
        console.log(url);
        MOCServer.httpRequest(url, caller, event);
    }

    private static callback(response: string, caller: any, event: string): void {
        // Parse the JSON to get an object
        const result = JSON.parse(response);
        // Send the result to the component that did the query
        caller.$root.$emit(event, result);
    }

    private static httpRequest(url: string, caller: any, event: string): void {
        const xmlHttp = new XMLHttpRequest();
        // let bodyElement = document.getElementsByTagName("BODY")[0] as HTMLElement;
        // bodyElement.style.cursor = 'progress';

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                const response = xmlHttp.responseText;
                MOCServer.callback(response, caller, event);

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
}

export class TreeViewportMOCServerQuery extends MOCServer {
    public static getUrl(vp: Viewport): string {
        let url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type&' +
        'expr=(dataproduct_type=image,catalog)';
        url += vp ? '&' + vp.toString() : '';

        return url;
    }

    public static query(caller: any, vp: Viewport): void {
        const url = this.getUrl(vp);
        MOCServer.query(url, caller, 'viewportTree');
    }
}

export class TreeFilterMOCServerQuery extends MOCServer {
    public static getUrl(filter: string): string {
        let url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type&' +
        'casesensitive=false&' +
        'expr=(dataproduct_type=image,catalog';
        let filterUri = ')';

        if (filter) {
            const kws = filter.split(' ');
            filterUri = '';
            kws.forEach((kw) => {
                filterUri += '&&obs_*=*' + kw + '*';
            });
            filterUri += ')';
        }
        url += encodeURIComponent(filterUri);

        return url;
    }

    public static query(caller: any, filter: string): void {
        const url = this.getUrl(filter);
        MOCServer.query(url, caller, 'filterTree');
    }
}


export class RetrieveAllDatasetHeadersQuery extends MOCServer {
    public static getUrl(): string {
        const url = MOCServer.URL +
        'get=record&' +
        'fmt=json&' +
        'fields=ID, obs_id, obs_title, client_category, dataproduct_type&' +
        'expr=(dataproduct_type=image,catalog)';

        return url;
    }

    public static query(caller: any): void {
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

    public static query(caller: any, id: string): void {
        const url = this.getUrl(id);
        MOCServer.query(url, caller, 'retrieveRecordCollection');
    }
}
