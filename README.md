# infinite-tree [![build status](https://travis-ci.org/cheton/infinite-tree.svg?branch=master)](https://travis-ci.org/cheton/infinite-tree) [![Coverage Status](https://coveralls.io/repos/cheton/infinite-tree/badge.svg)](https://coveralls.io/r/cheton/infinite-tree)
[![NPM](https://nodei.co/npm/infinite-tree.png?downloads=true&stars=true)](https://nodei.co/npm/infinite-tree/)

A browser-ready tree library that can efficiently display a large tree with smooth scrolling.

<i>
**The project is under heavy development and a lot of things are changing.**<br>
**Stay tuned for more information later.**
</i>

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
    children: [
        { id: 'apple', label: 'Apple' },
        { id: 'banana', label: 'Banana', children: [{ id: 'cherry', label: 'Cherry' }] }
    ]
};
const tree = new InfiniteTree({
  el: document.querySelector('#tree'),
  data: [data],
  autoOpen: true
});

tree.on('tree.open', (node) => {
});
tree.on('tree.close', (node) => {
});
tree.on('tree.select', (node) => {
});
```
