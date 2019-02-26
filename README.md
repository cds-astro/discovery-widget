# [Sky Data Collections Discovery Tree](http://cdsportal.u-strasbg.fr/moctree/)

The Sky Data Collections Discovery Tree (abbreviated as **discovery tree** in next sections) is a new embeddable web portal component. It allows a fast and easy retrival of astronomical catalogs and image sky surveys. This component follows what has been done in Aladin desktop, allowing the user to search for specific catalogs/sky surveys by browsing a tree. The component is currently developped with Aladin-lite but aims at becoming embeddable in other web portals (i.e. firefly) in the future.

## Where can I test it ?

The discovery tree can be tested at this [link](http://cdsportal.u-strasbg.fr/moctree/)

## Features

Currently, the discovery tree comprises the following features:

- A discrete icon for opening/closing the discovery tree. ![Icon](https://github.com/cds-astro/discovery-widget/blob/master/misc/open_close_icon.png)
- A hierarchical browsing tree reducing the amount of catalogs/sky surveys being printed at once.
![HierarchicalTree](https://github.com/cds-astro/discovery-widget/blob/master/misc/hierarchical_browsing_tree.png)

*Possibility to go back to the parent directories by clicking on the path*
- A text box for seeking datasets by name, bibcode. User can search for multiples names by separing them by spaces.
- The display of fundamental informations such as a description of the catalog/HiPS sky surveys, a preview image of the observations density/survey depending on whether it is a catalog or a image sky survey. The user can choose to plot a sky survey/catalog on the web portal view along with its coverage map, see its metadata directly on the [CDS MOCServer](http://alasky.unistra.fr/MocServer/query) and inspect its bibcode on [ADS](https://ui.adsabs.harvard.edu/).
![DatasetSelection](https://github.com/cds-astro/discovery-widget/blob/master/misc/sky_survey_selection.png)

*A description popup appears when the user moves the mouse on the name of the dataset*
- The possibility to track which catalogs/sky surveys have observations in the current viewport: catalogs printed in *green* contain observations in the viewport whereas those printed in *red* do not contain any observations in the viewport.
- A powerful filter allowing to filter the amount of catalogs/sky surveys returned by the [CDS MOCServer](http://alasky.unistra.fr/MocServer/query). It is possible to filter the datasets by *bandwidth*, *date of publishing*, *electromagnetic magnitudes* in *eV*, *Hz* or *m*, *type* of datasets (i.e. images or catalogs), *mission* (AKARI, Chandra, ...) and *astronomy*.
![Filter](https://github.com/cds-astro/discovery-widget/blob/master/misc/filter_view.png)

*Seeking for Infrared, UV datasets from 1979 to 1996*

## Contribution

PRs, bug reporting, feature requests are warmly welcomed ! Do not fear posting issues.

This project uses webpack and the node package manager. After cloning the repo and cd the repo directory you can type the following commands.

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Licence

This project is distributed under the BSD 3-clause "New" or "Revised" license.
