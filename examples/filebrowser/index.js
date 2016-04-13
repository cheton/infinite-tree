import InfiniteTree from '../../src';
import renderer from './renderer';
import './index.styl';
import { addEventListener, preventDefault, stopPropagation, quoteattr } from '../../src/helper';
import data from './data';

const tree = new InfiniteTree(document.querySelector('#tree'), {
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
    const node = tree.getSelectedNode();
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

window.tree = tree;
