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
        accept: (opts) => {
            const { type, draggableTarget, droppableTarget, node } = opts;

            if (elementClass(event.target).has('infinite-tree-overlay')) {
                elementClass(event.target).add('hover'); // add hover class
            } else {
                const el = tree.contentElement.querySelector('.infinite-tree-overlay');
                elementClass(el).remove('hover'); // remove hover class
            }

            return true;
        },
        drop: (e, opts) => {
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

let selectedNodes = [];
tree.on('click', (event) => {
    console.log('click', event);

    const currentNode = tree.getNodeFromPoint(event.x, event.y);
    if (!currentNode) {
        return;
    }

    const multipleSelectionMode = event.ctrlKey || event.metaKey;

    if (!multipleSelectionMode) {
        if (selectedNodes.length > 0) {
            // Call event.stopPropagation() to stop event bubbling
            event.stopPropagation();

            // Empty an array of selected nodes
            selectedNodes.forEach(selectedNode => {
                selectedNode.state.selected = false;
                tree.updateNode(selectedNode, {}, { shallowRendering: true });
            });
            selectedNodes = [];

            // Select current node
            tree.state.selectedNode = currentNode;
            currentNode.state.selected = true;
            tree.updateNode(currentNode, {}, { shallowRendering: true });
        }
        return;
    }

    // Call event.stopPropagation() to stop event bubbling
    event.stopPropagation();

    const selectedNode = tree.getSelectedNode();
    if (selectedNodes.length === 0 && selectedNode) {
        selectedNodes.push(selectedNode);
        tree.state.selectedNode = null;
    }

    const index = selectedNodes.indexOf(currentNode);

    // Remove current node if the array length of selected nodes is greater than 1
    if (index >= 0 && selectedNodes.length > 1) {
        currentNode.state.selected = false;
        selectedNodes.splice(index, 1);
        tree.updateNode(currentNode, {}, { shallowRendering: true });
    }

    // Add current node to the selected nodes
    if (index < 0) {
        currentNode.state.selected = true;
        selectedNodes.push(currentNode);
        tree.updateNode(currentNode, {}, { shallowRendering: true });
    }
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
tree.on('willOpenNode', (node) => {
    console.log('willOpenNode:', node);
});
tree.on('willCloseNode', (node) => {
    console.log('willCloseNode:', node);
});
tree.on('willSelectNode', (node) => {
    console.log('willSelectNode:', node);
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

let ghostElement = null;
let draggingX = 0;
let draggingY = 0;

addEventListener(document, 'dragstart', (e) => {
    draggingX = 0;
    draggingY = 0;
});

addEventListener(document, 'dragend', (e) => {
    if (ghostElement) {
        ghostElement.parentNode.removeChild(ghostElement);
        ghostElement = null;
    }
});

addEventListener(tree.contentElement, 'dragover', (e) => {
    preventDefault(event);

    event = event || window.event;

    const movementX = event.x - (Number(draggingX) || event.x);
    const movementY = event.y - (Number(draggingY) || event.y);

    draggingX = event.x;
    draggingY = event.y;

    if (movementY === 0) {
        return;
    }

    let el = document.elementFromPoint(event.x, event.y);
    while (el && el.parentElement !== tree.contentElement) {
        el = el.parentElement;
    }
    if (!el || el === ghostElement) {
        return;
    }

    const id = el.getAttribute(tree.options.nodeIdAttr);
    if (id === undefined) {
        return;
    }

    const rect = el.getBoundingClientRect();
    const tolerance = 5;

    if (event.y <= rect.top + tolerance) {
        if (ghostElement) {
            ghostElement.parentNode.removeChild(ghostElement);
            ghostElement = null;
        }

        if (el.parentNode) {
            ghostElement = document.createElement('div');
            ghostElement.style.height = '20px';
            ghostElement.style.border = '1px dotted #ccc';
            ghostElement.style.backgroundColor = '#f5f6f7';
            el.parentNode.insertBefore(ghostElement, el);
        }
    } else if (rect.top + el.offsetHeight <= event.y) {
        if (el.nextSibling !== ghostElement) {
            if (ghostElement) {
                ghostElement.parentNode.removeChild(ghostElement);
                ghostElement = null;
            }

            if (el.parentNode) {
                ghostElement = document.createElement('div');
                ghostElement.style.height = '20px';
                ghostElement.style.border = '1px dotted #ccc';
                ghostElement.style.backgroundColor = '#f5f6f7';
                el.parentNode.insertBefore(ghostElement, el.nextSibling);
            }
        }
    } else if (ghostElement) {
        ghostElement.parentNode.removeChild(ghostElement);
        ghostElement = null;
    }
});

window.examples = {
    ...window.examples,
    classic: {
        tree: tree
    }
};

export {
    load
}
