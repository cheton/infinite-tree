# infinite-tree [![build status](https://travis-ci.org/cheton/infinite-tree.svg?branch=master)](https://travis-ci.org/cheton/infinite-tree) [![Coverage Status](https://coveralls.io/repos/cheton/infinite-tree/badge.svg)](https://coveralls.io/r/cheton/infinite-tree)
[![NPM](https://nodei.co/npm/infinite-tree.png?downloads=true&stars=true)](https://nodei.co/npm/infinite-tree/)

A browser-ready tree library that can efficiently display a large tree with smooth scrolling. Powered by [FlatTree](https://github.com/cheton/flattree) and [Clusterize.js](https://github.com/NeXTs/Clusterize.js).

View [demo](http://cheton.github.io/infinite-tree) at http://cheton.github.io/infinite-tree.

[![infinite-tree](https://raw.githubusercontent.com/cheton/infinite-tree/master/media/infinite-tree.gif)](http://cheton.github.io/infinite-tree)

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
tree.on('update', () => {
    console.log(tree.getSelectedNode());
});
tree.on('openNode', (node) => {
});
tree.on('closeNode', (node) => {
});
tree.on('selectNode', (node) => {
});
tree.on('scrollProgress', (progress) => {
});
tree.on('drop', (node, e) => {
});
```

## API Documentation
* [Tree API](https://github.com/cheton/infinite-tree/wiki/API-Documentation:-Tree-API)
* [Node API](https://github.com/cheton/infinite-tree/wiki/API-Documentation:-Node-API)

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

Find a more advanced example at [examples/renderer.js](https://github.com/cheton/infinite-tree/blob/master/examples/renderer.js).

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
