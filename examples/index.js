import InfiniteTree from '../src';
import rowRenderer from './renderer';
import '../src/index.styl';
import { quoteattr } from '../src/helper';

const data = [];
const source = '{"id":"<root>","label":"<root>","props":{"droppable":true},"children":[{"id":"alpha","label":"Alpha","props":{"droppable":true}},{"id":"bravo","label":"Bravo","props":{"droppable":true},"children":[{"id":"charlie","label":"Charlie","props":{"droppable":true},"children":[{"id":"delta","label":"Delta","props":{"droppable":true},"children":[{"id":"echo","label":"Echo","props":{"droppable":true}},{"id":"foxtrot","label":"Foxtrot","props":{"droppable":true}}]},{"id":"golf","label":"Golf","props":{"droppable":true}}]},{"id":"hotel","label":"Hotel","props":{"droppable":true},"children":[{"id":"india","label":"India","props":{"droppable":true},"children":[{"id":"juliet","label":"Juliet","props":{"droppable":true}}]}]},{"id":"kilo","label":"Kilo","props":{"droppable":true}}]}]}';

for (let i = 0; i < 1000; ++i) {
    data.push(JSON.parse(source.replace(/"(id|label)":"([^"]*)"/g, '"$1": "$2.' + i + '"')));
}

const tree = new InfiniteTree({
    autoOpen: true,
    droppable: true,
    el: document.querySelector('#tree'),
    rowRenderer: rowRenderer
});

const updatePreview = (node) => {
    const el = document.querySelector('#preview');
    if (node) {
        el.innerHTML = JSON.stringify({
            id: node.id,
            label: node.label,
            children: node.children ? node.children.length : 0,
            parent: node.parent ? node.parent.id : null,
            state: node.state
        }, null, 2);
    } else {
        el.innerHTML = '';
    }
};

tree.on('scrollProgress', (progress) => {
    document.querySelector('#scrolling-progress').style = 'width: ' + progress + '%';
});
tree.on('update', () => {
    const node = tree.getSelectedNode();
    updatePreview(node);
});
tree.on('openNode', (node) => {
    console.log('openNode', node);
});
tree.on('closeNode', (node) => {
    console.log('closeNode', node);
});
tree.on('dropNode', (node, e) => {
    const source = e.dataTransfer.getData('text');
    const el = document.querySelector('#dropped-result');
    el.innerHTML = 'Dropped to <b>' + quoteattr(node.label) + '</b>';
});
tree.on('selectNode', (node) => {
    updatePreview(node);
});

tree.loadData(data);

// Draggable Element
const draggableElement = document.querySelector('#draggable-element');
draggableElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', e.target.id);
});
draggableElement.addEventListener('dragend', (e) => {
});

window.tree = tree;
