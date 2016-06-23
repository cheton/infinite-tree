# Infinite Tree [![build status](https://travis-ci.org/cheton/infinite-tree.svg?branch=master)](https://travis-ci.org/cheton/infinite-tree) [![Coverage Status](https://coveralls.io/repos/github/cheton/infinite-tree/badge.svg?branch=master)](https://coveralls.io/github/cheton/infinite-tree?branch=master)
[![NPM](https://nodei.co/npm/infinite-tree.png?downloads=true&stars=true)](https://www.npmjs.com/package/infinite-tree)

A browser-ready tree library that can efficiently display a large tree with smooth scrolling.

Powered by [FlatTree](https://github.com/cheton/flattree) and [Clusterize.js](https://github.com/NeXTs/Clusterize.js).

Demo: http://cheton.github.io/infinite-tree

[![infinite-tree](https://raw.githubusercontent.com/cheton/infinite-tree/master/media/infinite-tree.gif)](http://cheton.github.io/infinite-tree)

## Features
* High performance infinite scroll with large data set
* [Customizable renderer](https://github.com/cheton/infinite-tree/wiki/Options#rowrenderer) to render the tree in any form
* [Load nodes on demand](https://github.com/cheton/infinite-tree/wiki/Options#loadnodes)
* Native HTML5 drag and drop API
* A rich set of [APIs](https://github.com/cheton/infinite-tree#api-documentation)
* No jQuery

## Browser Support
![Chrome](https://raw.github.com/alrra/browser-logos/master/chrome/chrome_48x48.png)<br>Chrome | ![Edge](https://raw.github.com/alrra/browser-logos/master/edge/edge_48x48.png)<br>Edge | ![Firefox](https://raw.github.com/alrra/browser-logos/master/firefox/firefox_48x48.png)<br>Firefox | ![IE](https://raw.github.com/alrra/browser-logos/master/internet-explorer/internet-explorer_48x48.png)<br>IE | ![Opera](https://raw.github.com/alrra/browser-logos/master/opera/opera_48x48.png)<br>Opera | ![Safari](https://raw.github.com/alrra/browser-logos/master/safari/safari_48x48.png)<br>Safari
--- | --- | --- | --- | --- | --- |
 Yes | Yes | Yes| 8+ | Yes | Yes | 
Need to include [es5-shim](https://github.com/es-shims/es5-shim#example-of-applying-es-compatability-shims-in-a-browser-project) polyfill for IE8

## React Support
Check out <b>react-infinite-tree</b> at https://github.com/cheton/react-infinite-tree.

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
    name: 'Fruit',
    children: [{
        id: 'apple',
        name: 'Apple'
    }, {
        id: 'banana',
        name: 'Banana',
        children: [{
            id: 'cherry',
            name: 'Cherry',
            loadOnDemand: true
        }]
    }]
};

var tree = new InfiniteTree({
    el: document.querySelector('#tree'),
    data: data,
    autoOpen: true, // Defaults to false
    droppable: { // Defaults to false
        hoverClass: 'infinite-tree-droppable-hover',
        accept: function(event, options) {
            return true;
        },
        drop: function(event, options) {
        }
    },
    loadNodes: function(parentNode, done) { // Load node on demand
        var nodes = [];
        setTimeout(function() { // Loading...
            done(null, nodes);
        }, 1000);
    },
    nodeIdAttr: 'data-id', // the node id attribute
    rowRenderer: function(node, treeOptions) { // Customizable renderer
        return '<div data-id="<node-id>" class="infinite-tree-item">' + node.name + '</div>';
    },
    shouldSelectNode: function(node) { // Determine if the node is selectable
        if (!node || (node === tree.getSelectedNode())) {
            return false; // Prevent from deselecting the current node
        }
        return true;
    }
});
```

#### Functions Usage
Learn more: [Tree](https://github.com/cheton/infinite-tree/wiki/Functions:-Tree) /  [Node](https://github.com/cheton/infinite-tree/wiki/Functions:-Node)
```js
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
```

#### Events Usage
Learn more: [Events](https://github.com/cheton/infinite-tree/wiki/Events)
```js
tree.on('click', function(event) {
});
tree.on('clusterWillChange', function() {
});
tree.on('clusterDidChange', function() {
});
tree.on('contentWillUpdate', function() {
});
tree.on('contentDidUpdate', function() {
});
tree.on('openNode', function(node) {
});
tree.on('closeNode', function(node) {
});
tree.on('selectNode', function(node) {
});
```

## API Documentation
* [Options](https://github.com/cheton/infinite-tree/wiki/Options)
* [Functions: Tree](https://github.com/cheton/infinite-tree/wiki/Functions:-Tree)
* [Functions: Node](https://github.com/cheton/infinite-tree/wiki/Functions:-Node)
* [Events](https://github.com/cheton/infinite-tree/wiki/Events)

## FAQ

#### How to attach click event listeners to nodes?

Use <b>event delegation</b> <sup>[[1](http://javascript.info/tutorial/event-delegation), [2](http://davidwalsh.name/event-delegate)]</sup>

```js
var elementClass = require('element-class');
var el = document.querySelector('#tree');
var tree = new InfiniteTree(el, { /* options */ });

tree.on('click', function(event) {
    var target = event.target || event.srcElement; // IE8

    // Call event.stopPropagation() if you want to prevent the execution of
    // default tree operations like selectNode, openNode, and closeNode.
    event.stopPropagation();
    
    // Check if the target element contains a specific class
    if (!elementClass(target).has('my-specific-class')) {
        return;
    }

    // do stuff with the target element.
    console.log(target);
};

```

Event delegation with jQuery:
```js
var el = document.querySelector('#tree');
var tree = new InfiniteTree(el, { /* options */ });

// jQuery
$(tree.contentElement).on('click', 'your-event-selector', function(event) {
    // Call event.stopPropagation() if you want to prevent the execution of
    // default tree operations like selectNode, openNode, and closeNode.
    event.stopPropagation();
    
    // do stuff with the target element.
    console.log(event.target);
});
```

## License

Copyright (c) 2016 Cheton Wu

Licensed under the [MIT License](LICENSE).
