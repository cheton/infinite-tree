# infinite-tree [![build status](https://travis-ci.org/cheton/infinite-tree.svg?branch=master)](https://travis-ci.org/cheton/infinite-tree) [![Coverage Status](https://coveralls.io/repos/cheton/infinite-tree/badge.svg)](https://coveralls.io/r/cheton/infinite-tree)
[![NPM](https://nodei.co/npm/infinite-tree.png?downloads=true&stars=true)](https://nodei.co/npm/infinite-tree/)

A browser-ready tree library that can efficiently display a large tree with smooth scrolling. Powered by [FlatTree](https://github.com/cheton/flattree) and [Clusterize.js](https://github.com/NeXTs/Clusterize.js).

View [demo](http://cheton.github.io/infinite-tree) at http://cheton.github.io/infinite-tree.

#### The project is under heavy development and a lot of things are changing. Stay tuned for more information later.


## Installation
```bash
npm install --save infinite-tree
```

## Usage
```js
import InfiniteTree from 'infinite-tree';
import 'infinite-tree/dist/infinite-tree.css';

const data = {
    id: 'fruit',
    label: 'Fruit',
    children: [{
        id: 'apple',
        label: 'Apple'
    }, {
        id: 'banana',
        label: 'Banana',
        children: [{
            id: 'cherry',
            label: 'Cherry'
        }]
    }]
};
const tree = new InfiniteTree({
    autoOpen: true,
    el: document.querySelector('#tree'),
    // tree data
    data: data
});
tree.on('tree.open', (node) => {
});
tree.on('tree.close', (node) => {
});
tree.on('tree.select', (node) => {
});
```

## Options
Below are the configuration options with their default values:
```js
{
    autoOpen: false,
    el: null,
    rowRenderer: defaultRowRenderer,
    data: []
}
```

#### autoOpen

Type: `Boolean` Default: `false`

Set to `true` to open all nodes.


#### el

Type: `DOMElement` Default: `null`

The DOM element for rendering a tree.


#### rowRenderer

Type: `Function` Default: [defaultRowRenderer](https://github.com/cheton/infinite-tree/blob/master/src/renderer.js)

A custom row renderer that returns a HTML string. An example of minimum setup is shown as below:
```js
function (node) {
    var state = node.state;
    // Check node state
    var html = [
        '<div aria-id=' + JSON.stringify(node.id) + ' class="tree-item tree-selected">',
        '   <div class="tree-node">',
        '       <a class="tree-toggler tree-toggler-closed">►</a>',
        '       <span class="tree-title">' + node.label + '</span>',
        '   </div>',
        '</div>',
        ''
    ].join('\r\n');
    return html;
}
```


#### data

Type: `Object` or `Array` Default: `[]`

Define a tree node structure like so:
```js
[
    { // node
        id: '<unique-node-id>', // Required
        label: 'Node Label', // Required
        children: [] // Optional
    }
]
```
