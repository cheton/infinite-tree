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
    data: data,
    droppable: false,
    el: document.querySelector('#tree')
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
tree.on('dropNode', (node, evt) => {
});
tree.on('scrollProgress', (progress) => {
});
```

## API Documentation
* [Options](https://github.com/cheton/infinite-tree/wiki/Options)
* [Functions: Tree](https://github.com/cheton/infinite-tree/wiki/Functions:-Tree)
* [Functions: Node](https://github.com/cheton/infinite-tree/wiki/Functions:-Node)
* [Events](https://github.com/cheton/infinite-tree/wiki/Events)
