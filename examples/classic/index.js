import InfiniteTree from '../../src';
import renderer from './renderer';
import './index.styl';
import './animation.styl';
import { addEventListener, preventDefault, stopPropagation, quoteattr } from '../../src/helper';
import data from './data.json';

const updatePreview = (node) => {
    const el = document.querySelector('#classic [data-id="preview"]');
    if (node) {
        let o = {
            id: node.id,
            label: node.label,
            children: node.children ? node.children.length : 0,
            parent: node.parent ? node.parent.id : null,
            state: node.state
        };
        if (node.loadOnDemand !== undefined) {
            o.loadOnDemand = node.loadOnDemand;
        }
        el.innerHTML = JSON.stringify(o, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
    } else {
        el.innerHTML = '';
    }
};

const tree = new InfiniteTree(document.querySelector('#classic [data-id="tree"]'), {
    autoOpen: true, // Defaults to false
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

tree.on('scrollProgress', (progress) => {
    document.querySelector('#classic [data-id="scrolling-progress"]').style.width = progress + '%';
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
    console.log('Dragged an element ' + JSON.stringify(source) + ' and dropped to ' + JSON.stringify(node.label));
    document.querySelector('#classic [data-id="dropped-result"]').innerHTML = 'Dropped to <b>' + quoteattr(node.label) + '</b>';
});
tree.on('selectNode', (node) => {
    updatePreview(node);
});

tree.loadData(data);

// Draggable Element
const draggableElement = document.querySelector('#classic [data-id="draggable-element"]');

// http://stackoverflow.com/questions/5500615/internet-explorer-9-drag-and-drop-dnd
addEventListener(draggableElement, 'selectstart', (e) => {
    preventDefault(e);
    stopPropagation(e);
    draggableElement.dragDrop();
    return false;
});

addEventListener(draggableElement, 'dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    const target = e.target || e.srcElement;
    e.dataTransfer.setData('text', target.id);
    document.querySelector('#classic [data-id="dropped-result"]').innerHTML = '';
});

addEventListener(draggableElement, 'dragend', function(e) {
});

const load = () => {
    // Select the first node
    tree.selectNode(tree.getChildNodes()[0]);
};

export {
    load
}
