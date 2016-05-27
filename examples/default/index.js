import InfiniteTree from '../../src';
import './index.styl';
import './animation.styl';
import { classNames, addClass, removeClass, hasClass, addEventListener, preventDefault, stopPropagation, quoteattr } from '../../src/helper';
import data from '../data.json';

const updatePreview = (node) => {
    const el = document.querySelector('#default [data-id="preview"]');
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

const tree = new InfiniteTree(document.querySelector('#default [data-id="tree"]'), {
    autoOpen: true, // Defaults to false
    droppable: {
        hoverClass: 'infinite-tree-drop-hover',
        accept: function(event, opts) {
            const { type, draggableTarget, droppableTarget, node } = opts;

            if (hasClass(event.target, 'infinite-tree-overlay')) {
                addClass(event.target, 'hover'); // add hover class
            } else {
                const el = tree.contentElement.querySelector('.infinite-tree-overlay');
                removeClass(el, 'hover'); // remove hover class
            }

            return true;
        },
        drop: function(event, opts) {
            const { draggableTarget, droppableTarget, node } = opts;

            if (hasClass(event.target, 'infinite-tree-overlay')) {
                removeClass(event.target, 'hover'); // remove hover class
                const innerHTML = 'Dropped to an overlay element';
                document.querySelector('#default [data-id="dropped-result"]').innerHTML = innerHTML;
                return;
            }

            console.log('drop:', event, event.dataTransfer.getData('text'));
            const innerHTML = 'Dropped to <b>' + quoteattr(node.name) + '</b>';
            document.querySelector('#default [data-id="dropped-result"]').innerHTML = innerHTML;
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
tree.on('clusterDidChange', () => {
    const overlayElement = document.createElement('div');
    const top = tree.nodes.indexOf(tree.getNodeById('<root>.1'));
    const bottom = tree.nodes.indexOf(tree.getNodeById('<root>.2'));

    overlayElement.className = classNames(
        'infinite-tree-overlay'
    );
    overlayElement.style.top = top * 22 + 'px';
    overlayElement.style.height = (bottom - top) * 22 + 'px';
    overlayElement.style.lineHeight = (bottom - top) * 22 + 'px';
    overlayElement.appendChild(document.createTextNode('OVERLAY'));
    tree.contentElement.appendChild(overlayElement);
});

tree.loadData(JSON.parse(JSON.stringify(data)));

// Scroll Element
addEventListener(tree.scrollElement, 'scroll', (e) => {
    const progress = (tree.scrollElement.scrollTop / tree.contentElement.clientHeight) * 100 || 0;
    document.querySelector('#default [data-id="scrolling-progress"]').style.width = progress + '%';
});

// Draggable Element
const draggableElement = document.querySelector('#default [data-id="draggable-element"]');

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
    document.querySelector('#default [data-id="dropped-result"]').innerHTML = '';
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
