import events from 'events';
import Clusterize from 'clusterize.js';
import { buildHTML, classNames, quoteattr } from './utils';
import { flatten } from 'flattree';

const extend = (target, ...sources) => {
    sources.forEach((source) => {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    });

    return target;
};

const addEventListener = (target, type, listener) => {
    if (target.attachEvent) {
        return target.attachEvent('on' + type, listener);
    } else {
        return target.addEventListener(type, listener, false);
    }
};

const removeEventListener = (target, type, listener) => {
    if (target.detachEvent) {
        return target.detachEvent('on' + type, listener);
    } else {
        return target.removeEventListener(type, listener, false);
    }
};

const stopPropagation = (evt) => {
    if (typeof evt.stopPropagation !== 'undefined') {
        evt.stopPropagation();
    } else {
        evt.cancelBubble = true;
    }
};

const generateRowsByNodes = (nodes = []) => {
    const rows = nodes.map((node) => {
        const { id, label, state } = node;
        const { depth, more, open, path, children, total, selected = false } = state;

        let togglerContent = '';
        if (more && open) {
            togglerContent = '▼';
        }
        if (more && !open) {
            togglerContent = '►';
        }
        const toggler = buildHTML('a', togglerContent, {
            'class': (() => {
                if (more && open) {
                    return classNames(
                        'tree-toggler'
                    );
                }
                if (more && !open) {
                    return classNames(
                        'tree-toggler',
                        'tree-closed'
                    );
                }
                return '';
            })()
        });
        const title = buildHTML('span', quoteattr(label), {
            'class': classNames('tree-title')
        });
        const treeNode = buildHTML('div', toggler + title, {
            'class': 'tree-node',
            'style': 'margin-left: ' + depth * 12 + 'px'
        });
        const treeItem = buildHTML('div', treeNode, {
            'aria-id': id,
            'aria-expanded': more && open,
            'aria-depth': depth,
            'aria-path': path,
            'aria-selected': selected,
            'aria-children': children ? Object.keys(children).length : 0,
            'aria-total': total,
            'class': classNames(
                'tree-item',
                { 'tree-selected': selected }
            )
        });

        return treeItem;
    });

    return rows;
};

class InfiniteTree extends events.EventEmitter {
    options = {
        el: null,
        autoOpen: false
    };
    state = {
        openNodes: [],
        selectedNode: null
    };
    clusterize = null;
    nodes = [];
    rows = [];
    contentElement = null;
    contentListener = (evt) => {
        let { target, currentTarget } = evt;

        stopPropagation(evt);

        if (target !== currentTarget) {
            let itemTarget = target;

            while (itemTarget && itemTarget.parentElement !== currentTarget) {
                itemTarget = itemTarget.parentElement;
            }

            const id = itemTarget.getAttribute('aria-id');
            const nodeIndex = ((id) => {
                for (let i = 0; i < this.nodes.length; ++i) {
                    let node = this.nodes[i];
                    if (node.id === id) {
                        return i;
                    }
                }
                return -1;
            })(id);

            const node = this.nodes[nodeIndex];
            const { openNode, closeNode, selectNode } = this.eventHandler;

            // Click on the toggler to open/close a tree node
            if (target.className.indexOf('tree-toggler') >= 0) {
                if (this.state.openNodes.indexOf(node) >= 0) { // Close node
                    closeNode({ evt, node, nodeIndex });
                } else {
                    openNode({ evt, node, nodeIndex });
                }
            } else {
                selectNode({ evt, node, nodeIndex });
            }

            this.clusterize.update(this.rows);
        }
    };
    eventHandler = {
        closeNode: ({ evt, node, nodeIndex }) => {
            // Keep selected node unchanged if "node" is equal to "this.state.selectedNode"
            if (this.state.selectedNode && (this.state.selectedNode !== node)) {
                const { selectNode } = this.eventHandler;

                // Action:
                //   close "node.0.0"
                //
                // Tree:
                // [0] - node.0
                // [1]  - node.0.0      => next selected node (index=1, total=2)
                // [2]      node.0.0.0  => last selected node (index=2, total=0)
                // [3]      node.0.0.1
                // [4]    node.0.1
                let selectedIndex = this.nodes.indexOf(this.state.selectedNode);
                let rangeFrom = nodeIndex + 1;
                let rangeTo = nodeIndex + node.state.total;

                if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                    selectNode({ evt, node, nodeIndex });
                }
            }

            node.state.open = false; // Set node.state.open to false
            const openNodes = this.state.openNodes.filter((node) => (node.state.more && node.state.open));
            this.state.openNodes = openNodes;

            const deleteCount = node.state.total;

            { // Traversing up through ancestors to subtract node.state.total
                let p = node;
                while (p) {
                    p.state.total = (p.state.total - deleteCount);
                    p = p.parent;
                }
            }

            // Remove elements from an array
            this.nodes.splice(nodeIndex + 1, deleteCount);
            this.rows.splice(nodeIndex + 1, deleteCount);
            this.rows[nodeIndex] = generateRowsByNodes([node])[0];
            this.emit('tree.close', node);
        },
        openNode: ({ evt, node, nodeIndex }) => {
            node.state.open = true; // Set node.state.open to true
            const openNodes = [node].concat(this.state.openNodes); // the most recently used items first
            this.state.openNodes = openNodes;

            const nodes = flatten(node.children, { openNodes: this.state.openNodes });
            const rows = generateRowsByNodes(nodes);

            // Insert an array inside another array
            this.nodes.splice.apply(this.nodes, [nodeIndex + 1, 0].concat(nodes));
            this.rows.splice.apply(this.rows, [nodeIndex + 1, 0].concat(rows));
            this.rows[nodeIndex] = generateRowsByNodes([node])[0];
            this.emit('tree.open', node);
        },
        selectNode: ({ evt, node, nodeIndex }) => {
            // select node
            if (this.state.selectedNode !== node) {
                node.state.selected = true;
                this.rows[nodeIndex] = generateRowsByNodes([node])[0];
            }

            // deselect node
            if (this.state.selectedNode) {
                let selectedNode = this.state.selectedNode;
                let selectedIndex = this.nodes.indexOf(selectedNode);
                selectedNode.state.selected = false;
                this.rows[selectedIndex] = generateRowsByNodes([selectedNode])[0];
            }

            if (this.state.selectedNode !== node) {
                this.state.selectedNode = node;
                this.emit('tree.select', node);
            } else {
                this.state.selectedNode = null;
                this.emit('tree.select', null);
            }
        }
    };

    constructor(options = {}) {
        super();

        const { autoOpen = false, el = null, data = null } = options;

        if (!el) {
            console.error('Failed to initialize infinite tree: el is not specified.');
            return;
        }

        // Assign options
        this.options = extend({}, { autoOpen, el });

        this.create();

        // Load tree data if it's provided
        if (data) {
            this.loadData(data);
        }
    }
    create() {
        const infiniteTree = document.createElement('div');
        infiniteTree.className = classNames('infinite-tree');
        const infiniteTreeScroll = document.createElement('div');
        infiniteTreeScroll.className = classNames('infinite-tree-scroll');
        const infiniteTreeContent = document.createElement('div');
        infiniteTreeContent.className = classNames('infinite-tree-content');

        infiniteTreeScroll.appendChild(infiniteTreeContent);
        infiniteTree.appendChild(infiniteTreeScroll);
        this.options.el.appendChild(infiniteTree);

        this.clusterize = new Clusterize({
            tag: 'div',
            rows: [],
            scrollElem: infiniteTreeScroll,
            contentElem: infiniteTreeContent,
            no_data_class: 'infinite-tree-no-data'
        });

        this.contentElement = infiniteTreeContent;
        addEventListener(this.contentElement, 'click', this.contentListener);
    }
    destroy() {
        removeEventListener(this.contentElement, 'click', this.contentListener);

        if (this.clusterize) {
            this.clusterize.clear();
            this.clusterize = null;
        }

        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.selectedNode = null;

        // Remove all child nodes
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
    }
    clear() {
        this.clusterize.clear();
        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.selectedNode = null;
    }
    // Add a new node after this existing node.
    // @param {object} newNode
    // @param {object} node
    addNodeAfter(newNode, node) {
        // TODO
    }
    // Add a new node before this existing node.
    // @param {object} newNode
    // @param {object} node
    addNodeBefore(newNode, node) {
        // TODO
    }
    // Add a new node as parent of this existing node.
    // @param {object} newNode
    // @param {object} node
    addParentNode(newNode, node) {
        // TODO
    }
    // Add a node to this parent node. If parentNode is empty, then the new node becomes a root node.
    // @param {object} newNode The new node
    // @param {object} parentNode The parent node
    appendNode(newNode, parentNode) {
        // TODO
    }
    // Close this node. The node must have child nodes.
    // @param {object} node
    closeNode(node) {
        // TODO
    }
    // Get a tree node by the unique node id. This assumes that you have given the nodes in the data a unique id.
    // @param {string|number} id The unique node id
    getNodeById(id) {
        // TODO
    }
    // Get the selected node. Returns the row data or null.
    getSelectedNode() {
        return this.state.selectedNode;
    }
    // Get the state of the tree.
    // @return {object} Returns an object that contains the ids of open nodes and selected nodes
    getState() {
        // TODO
    }
    // Get the root node of the tree.
    getTree() {
        let tree = (this.nodes.length > 0) ? this.nodes[0] : null;
        while (tree && tree.parent !== null) {
            tree = tree.parent;
        }
        return tree;
    }
    // Load data in the tree.
    // @param {object|array} data The data is a node object or array of nodes
    // @param {object} [options] The options object
    loadData(data = [], options = {}) {
        const { autoOpen = this.options.autoOpen } = options;

        this.nodes = flatten(data, { openAllNodes: autoOpen });

        const openNodes = this.nodes.filter((node) => (node.state.more && node.state.open));
        this.state.openNodes = openNodes;
        this.state.selectedNode = null;

        this.rows = generateRowsByNodes(this.nodes);
        this.clusterize.update(this.rows);
    }
    // Open this node. The node must have child nodes.
    // @param {object} node
    openNode(node) {
        // TODO
    }
    // Remove node from the tree
    // @param {object} node
    removeNode(node) {
        // TODO
    }
    // Scroll to this node.
    // @param {object} node
    scrollToNode(node) {
        // TODO
    }
    // Select this node. You can deselect the current node by calling selectNode(null).
    // @param {object} node
    selectNode(node) {
        // TODO
    }
    // Set the state of the tree. See getState for more information.
    // @param {object} state The state object
    // @param {string} [state.openNodes] The ids of open nodes
    // @param {string} [state.selectedNode] The id of selected node
    setState(state = {}) {
        // TODO
    }
    // Open or close this node.
    toggle(node) {
        // TODO
    }
    // Get the tree data as string.
    toString() {
        // TODO
    }
    // Update the title of a node. You can also update the data.
    // @param {object} node
    // @param {object} data The data object
    // @param {object} [data.label] The title of a node
    updateNode(node, data) {
        // TODO
    }
}

module.exports = InfiniteTree;
