import classNames from 'classnames';
import elementClass from 'element-class';
import escapeHTML from 'escape-html';
import InfiniteTree from '../../src';
import renderer from './renderer';
import './index.styl';
import './animation.styl';
import { addEventListener, preventDefault, stopPropagation } from '../../src/dom-events';
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

            if (elementClass(event.target).has('infinite-tree-overlay')) {
                elementClass(event.target).add('hover'); // add hover class
            } else {
                const el = tree.contentElement.querySelector('.infinite-tree-overlay');
                elementClass(el).remove('hover'); // remove hover class
            }

            return true;
        },
        drop: function(e, opts) {
            const { draggableTarget, droppableTarget, node } = opts;

            if (elementClass(event.target).has('infinite-tree-overlay')) {
                elementClass(event.target).remove('hover'); // remove hover class
                const innerHTML = 'Dropped to an overlay element';
                document.querySelector('#classic [data-id="dropped-result"]').innerHTML = innerHTML;
                return;
            }

            console.log('drop:', event, event.dataTransfer.getData('text'));
            const innerHTML = 'Dropped to <b>' + escapeHTML(node.name) + '</b>';
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
tree.on('keyDown', (event) => {
    event.preventDefault();

    console.log('keyDown', event);
    const node = tree.getSelectedNode();
    const nodeIndex = tree.getSelectedIndex();

    if (event.keyCode === 37) { // Left
        tree.closeNode(node);
    } else if (event.keyCode === 38) { // Up
        const prevNode = tree.nodes[nodeIndex - 1] || node;
        tree.selectNode(prevNode);
    } else if (event.keyCode === 39) { // Right
        tree.openNode(node);
    } else if (event.keyCode === 40) { // Down
        const nextNode = tree.nodes[nodeIndex + 1] || node;
        tree.selectNode(nextNode);
    }
});
tree.on('keyUp', (event) => {
    console.log('keyUp', event);
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
tree.on('clusterDidChange', () => {
    const overlayElement = document.createElement('div');
    const top = tree.nodes.indexOf(tree.getNodeById('<root>.1'));
    const bottom = tree.nodes.indexOf(tree.getNodeById('<root>.2'));
    const el = tree.contentElement.querySelector('.infinite-tree-item');
    const height = parseFloat(getComputedStyle(el).height);

    overlayElement.className = classNames(
        'infinite-tree-overlay'
    );
    overlayElement.style.top = top * height + 'px';
    overlayElement.style.height = (bottom - top) * height + 'px';
    overlayElement.style.lineHeight = (bottom - top) * height + 'px';
    overlayElement.appendChild(document.createTextNode('OVERLAY'));
    tree.contentElement.appendChild(overlayElement);
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

window.examples = {
    ...window.examples,
    classic: {
        tree: tree
    }
};

export {
    load
}
