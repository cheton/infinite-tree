import debounce from 'lodash/debounce';
import InfiniteTree from '../../src';
import renderer from './renderer';
import './index.styl';
import { addEventListener, preventDefault, stopPropagation, quoteattr } from '../../src/helper';
import data from './data';

// Makes header columns equal width to content columns
const fitHeaderColumns = () => {
    const row = document.querySelector('#filebrowser .infinite-tree-content tr.tree-item');
    const headers = document.querySelectorAll('#filebrowser table.filebrowser-header > thead > tr > th');
    for (let c = row.firstChild, i = 0; c !== null && i < headers.length; c = c.nextSibling, ++i) {
        headers[i].style.width = c.clientWidth + 'px';
    }
};

// Keep header equal width to tbody
const setHeaderWidth = () => {
    const header = document.querySelector('#filebrowser table.filebrowser-header');
    const content = document.querySelector('#filebrowser .infinite-tree-content');
    header.style.width = content.clientWidth + 'px';
};

// Update header columns width on window resize
window.onresize = function() {
    debounce(fitHeaderColumns, 150);
};

const tree = new InfiniteTree(document.querySelector('#filebrowser [data-id="tree"]'), {
    autoOpen: true, // Defaults to false
    containerView: 'table',
    droppable: true, // Defaults to false
    loadNodes: (parentNode, done) => {
        const suffix = parentNode.id.replace(/(\w)+/, '');
        const nodes = [
            {
                id: 'node1' + suffix,
                label: 'Node 1'
            },
            {
                id: 'node2' + suffix,
                label: 'Node 2'
            }
        ];
        setTimeout(() => {
            done(null, nodes);
        }, 1000);
    },
    rowRenderer: renderer,
    selectable: true, // Defaults to true
    shouldSelectNode: (node) => { // Defaults to null
        if (!node || (node === tree.getSelectedNode())) {
            return false; // Prevent from deselecting the current node
        }
        return true;
    }
});

tree.on('update', () => {
    fitHeaderColumns();
    setHeaderWidth();
});
tree.on('openNode', (node) => {
    console.log('openNode', node);
});
tree.on('closeNode', (node) => {
    console.log('closeNode', node);
});
tree.on('selectNode', (node) => {
});

tree.loadData(data);

// Select the first node
tree.selectNode(tree.getChildNodes()[0]);
