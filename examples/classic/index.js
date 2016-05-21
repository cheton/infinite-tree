import InfiniteTree from '../../src';
import renderer from './renderer';
import './index.styl';
import './animation.styl';
import { addEventListener, preventDefault, stopPropagation, quoteattr } from '../../src/helper';
import data from '../data.json';

const updatePreview = (node) => {
    const el = document.querySelector('#classic [data-id="preview"]');
    if (node) {
        let o = {
            id: node.id,
            name: node.name,
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
    droppable: {
        hoverClass: 'infinite-tree-drop-hover',
        accept: function(opts) {
            const { type, draggableTarget, droppableTarget, node } = opts;

            console.log(opts);

            return true;
        },
        drop: function(e, opts) {
            const { draggableTarget, droppableTarget, node } = opts;

            console.log('drop:', e, e.dataTransfer.getData('text'));

            const innerHTML = 'Dropped to <b>' + quoteattr(node.name) + '</b>';
            document.querySelector('#classic [data-id="dropped-result"]').innerHTML = innerHTML;
        }
    },
    loadNodes: (parentNode, done) => {
        const suffix = parentNode.id.replace(/(\w)+/, '');
        const nodes = [
            {
                id: 'node1' + suffix,
                name: 'Node 1'
            },
            {
                id: 'node2' + suffix,
                name: 'Node 2'
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

tree.on('click', (event) => {
    console.log('click', event);
});
tree.on('contentWillUpdate', () => {
    console.log('contentWillUpdate');
});
tree.on('contentDidUpdate', () => {
    console.log('contentDidUpdate');
    const node = tree.getSelectedNode();
    updatePreview(node);
});
tree.on('openNode', (node) => {
    console.log('openNode', node);
});
tree.on('closeNode', (node) => {
    console.log('closeNode', node);
});
tree.on('selectNode', (node) => {
    console.log('selectNode', node);
    updatePreview(node);
});

tree.loadData(JSON.parse(JSON.stringify(data)));

// Scroll Element
addEventListener(tree.scrollElement, 'scroll', (e) => {
    const progress = (tree.scrollElement.scrollTop / tree.contentElement.clientHeight) * 100 || 0;
    document.querySelector('#classic [data-id="scrolling-progress"]').style.width = progress + '%';
});

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
    e.dataTransfer.setData('text', target.getAttribute('data-id'));
    document.querySelector('#classic [data-id="dropped-result"]').innerHTML = '';
});

addEventListener(draggableElement, 'dragend', function(e) {
});

const load = () => {
    const childNodes = tree.getChildNodes();

    if (childNodes.length > 0) {
        // Select the first node
        tree.selectNode(childNodes[0]);
    }
};

export {
    load
}
