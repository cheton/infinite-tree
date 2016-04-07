# infinite-tree [![build status](https://travis-ci.org/cheton/infinite-tree.svg?branch=master)](https://travis-ci.org/cheton/infinite-tree) [![Coverage Status](https://coveralls.io/repos/cheton/infinite-tree/badge.svg)](https://coveralls.io/r/cheton/infinite-tree)
[![NPM](https://nodei.co/npm/infinite-tree.png?downloads=true&stars=true)](https://nodei.co/npm/infinite-tree/)

A browser-ready tree library that can efficiently display a large tree with smooth scrolling.

Powered by [FlatTree](https://github.com/cheton/flattree) and [Clusterize.js](https://github.com/NeXTs/Clusterize.js).

Demo: http://cheton.github.io/infinite-tree

[![infinite-tree](https://raw.githubusercontent.com/cheton/infinite-tree/master/media/infinite-tree.gif)](http://cheton.github.io/infinite-tree)

## Features
* Supported browsers: Chrome, Firefox, Safari, Microsoft Edge, IE8 with  [es5-shim](https://github.com/es-shims/es5-shim#example-of-applying-es-compatability-shims-in-a-browser-project) polyfill, IE9, IE10, and IE11. 
* [Customizable renderer](https://github.com/cheton/infinite-tree/wiki/Options#rowrenderer) to render the tree in any form
* High performance infinite scroll with large data set
* Native HTML5 drag and drop API
* A rich set of [APIs](https://github.com/cheton/infinite-tree#api-documentation)
* No jQuery

## Notice
<i>The project is under heavy development and a lot of things are changing. Stay tuned for further updates.</i>

## Installation
```bash
npm install --save infinite-tree
```

## Usage
```js
var InfiniteTree = require('infinite-tree');

// when using webpack and browserify
require('infinite-tree/dist/infinite-tree.css');

var data = {
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

var tree = new InfiniteTree({
    autoOpen: true, // Defaults to false
    data: data,
    droppable: false, // Defaults to false
    el: document.querySelector('#tree'),
    selectable: true, // Defaults to true
    shouldSelectNode: function(node) { // Defaults to null
        if (!node || (node === tree.getSelectedNode())) {
            return false; // Prevent from deselecting the current node
        }
        return true;
    }
});

//
// Functions: Tree & Node
//
var node = tree.getNodeById('fruit');
// → Node { id: 'fruit', ... }
tree.selectNode(node);
// → true
console.log(node.getFirstChild());
// → Node { id: 'apple', ... }
console.log(node.getFirstChild().getNextSibling());
// → Node { id: 'banana', ... }
console.log(node.getFirstChild().getPreviousSibling());
// → null

//
// Events
//
tree.on('update', function() {
    console.log(tree.getSelectedNode());
});
tree.on('openNode', function(node) {
});
tree.on('closeNode', function(node) {
});
tree.on('selectNode', function(node) {
});
tree.on('dropNode', function(node, evt) {
});
tree.on('scrollProgress', function(progress) {
});
```

## API Documentation
* [Options](https://github.com/cheton/infinite-tree/wiki/Options)
* [Functions: Tree](https://github.com/cheton/infinite-tree/wiki/Functions:-Tree)
* [Functions: Node](https://github.com/cheton/infinite-tree/wiki/Functions:-Node)
* [Events](https://github.com/cheton/infinite-tree/wiki/Events)

## License

Copyright (c) 2016 Cheton Wu

Licensed under the [MIT License](LICENSE).
