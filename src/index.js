import events from 'events';
import Clusterize from 'clusterize.js';
import { flatten } from 'flattree';
import { defaultRowRenderer } from './renderer';
import { stopPropagation, addEventListener, removeEventListener } from './polyfill';
import { classNames } from './utils';

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

class InfiniteTree extends events.EventEmitter {
    options = {
        autoOpen: false,
        el: null,
        rowRenderer: defaultRowRenderer
    };
    state = {
        openNodes: [],
        selectedNode: null
    };
    clusterize = null;
    nodebucket = {};
    nodes = [];
    rows = [];
    scrollElement = null;
    contentElement = null;

    contentListener = (evt) => {
        let { target, currentTarget } = evt;

        stopPropagation(evt);

        if (target !== currentTarget) {
            let itemTarget = target;
            let handleToggler = false;

            while (itemTarget && itemTarget.parentElement !== currentTarget) {
                if (itemTarget.className.indexOf('tree-toggler') >= 0) {
                    handleToggler = true;
                }
                itemTarget = itemTarget.parentElement;
            }

            const id = itemTarget.getAttribute('aria-id');
            const node = this.getNodeById(id);

            // Click on the toggler to open/close a tree node
            if (handleToggler) {
                if (this.state.openNodes.indexOf(node) >= 0) { // Close node
                    this.closeNode(node);
                } else {
                    this.openNode(node);
                }
            } else {
                this.selectNode(node);
            }
        }
    };

    constructor(options = {}) {
        super();

        // Assign options
        this.options = extend({}, this.options, options);

        if (!this.options.el) {
            console.error('Failed to initialize infinite-tree: el is not specified.', options);
            return;
        }

        this.create();

        // Load tree data if it's provided
        if (options.data) {
            this.loadData(options.data);
        }
    }
    create() {
        if (!this.options.el) {
            throw new Error('The element option is not specified.');
        }

        const scrollElement = document.createElement('div');
        scrollElement.className = classNames(
            'infinite-tree',
            'infinite-tree-scroll'
        );
        const contentElement = document.createElement('div');
        contentElement.className = classNames(
            'infinite-tree',
            'infinite-tree-content'
        );

        scrollElement.appendChild(contentElement);
        this.options.el.appendChild(scrollElement);

        this.clusterize = new Clusterize({
            tag: 'div',
            rows: [],
            scrollElem: scrollElement,
            contentElem: contentElement,
            no_data_class: 'infinite-tree-no-data',
            callbacks: {
                // Will be called right before replacing previous cluster with new one.
                clusterWillChange: () => {
                },
                // Will be called right after replacing previous cluster with new one.
                clusterChanged: () => {
                },
                // Will be called on scrolling. Returns progress position.
                scrollingProgress: (progress) => {
                    this.emit('scrollProgress', progress);
                }
            }
        });

        this.scrollElement = scrollElement;
        this.contentElement = contentElement;

        addEventListener(this.contentElement, 'click', this.contentListener);
    }
    destroy() {
        removeEventListener(this.contentElement, 'click', this.contentListener);

        this.clear();

        if (this.clusterize) {
            this.clusterize.destroy(true); // True to remove all data from the list
            this.clusterize = null;
        }

        // Remove all child nodes
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        while (this.scrollElement.firstChild) {
            this.scrollElement.removeChild(this.scrollElement.firstChild);
        }
        if (this.options.el) {
            const containerElement = this.options.el;
            while (containerElement.firstChild) {
                containerElement.removeChild(containerElement.firstChild);
            }
        }
        this.contentElement = null;
        this.scrollElement = null;
    }
    clear() {
        this.clusterize.clear();
        this.nodebucket = {};
        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.selectedNode = null;
    }
    // Updates list with new data
    update() {
        this.clusterize.update(this.rows);
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
    // @return {boolean} Returns true on success, false otherwise.
    closeNode(node) {
        const { rowRenderer } = this.options;

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node specified: node.id=' + JSON.stringify(node.id));
        }

        // Check if the closeNode action can be performed
        if (this.state.openNodes.indexOf(node) < 0) {
            return false;
        }

        // Keep selected node unchanged if "node" is equal to "this.state.selectedNode"
        if (this.state.selectedNode && (this.state.selectedNode !== node)) {
            // Action:
            //   close "node.0.0"
            //
            // Tree:
            // [0] - node.0
            // [1]  - node.0.0      => next selected node (index=1, total=2)
            // [2]      node.0.0.0  => last selected node (index=2, total=0)
            // [3]      node.0.0.1
            // [4]    node.0.1
            const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
            const rangeFrom = nodeIndex + 1;
            const rangeTo = nodeIndex + node.state.total;

            if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                this.selectNode(node);
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
        this.rows[nodeIndex] = rowRenderer(node);

        // Emit the 'closeNode' event
        this.emit('closeNode', node);

        // Updates list with new data
        this.update();

        return true;
    }
    // Get a tree node by the unique node id. This assumes that you have given the nodes in the data a unique id.
    // @param {string|number} id The unique node id. A null value will be returned if node.id not matched.
    getNodeById(id) {
        const node = (this.nodebucket[id] || [])[0];
        return (node !== undefined) ? node : null;
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
    loadData(data = []) {
        const { autoOpen, rowRenderer } = this.options;

        this.nodes = flatten(data, { openAllNodes: autoOpen });

        // Construct node bucket
        this.nodebucket = {};
        this.nodes.forEach((node) => {
            if (node.id !== undefined) {
                const nodebucket = this.nodebucket[node.id];
                this.nodebucket[node.id] = nodebucket ? nodebucket.concat(node) : [node];
            }
        });

        const openNodes = this.nodes.filter((node) => (node.state.more && node.state.open));
        this.state.openNodes = openNodes;
        this.state.selectedNode = null;

        this.rows = this.nodes.map(node => rowRenderer(node));

        // Updates list with new data
        this.update();
    }
    // Open this node. The node must have child nodes.
    // @param {object} node
    // @return {boolean} Returns true on success, false otherwise.
    openNode(node) {
        const { rowRenderer } = this.options;

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node specified: node.id=' + JSON.stringify(node.id));
        }

        // Check if the openNode action can be performed
        if (this.state.openNodes.indexOf(node) >= 0) {
            return false;
        }

        node.state.open = true; // Set node.state.open to true
        const openNodes = [node].concat(this.state.openNodes); // the most recently used items first
        this.state.openNodes = openNodes;

        const nodes = flatten(node.children, { openNodes: this.state.openNodes });
        const rows = nodes.map(node => rowRenderer(node));

        // Insert an array inside another array
        this.nodes.splice.apply(this.nodes, [nodeIndex + 1, 0].concat(nodes));
        this.rows.splice.apply(this.rows, [nodeIndex + 1, 0].concat(rows));
        this.rows[nodeIndex] = rowRenderer(node);

        // Emit the 'openNode' event
        this.emit('openNode', node);

        // Updates list with new data
        this.update();

        return true;
    }
    // Remove node from the tree
    // @param {object} node
    removeNode(node) {
        // TODO
    }
    // Set the current scroll position to this node.
    // @param {object} node
    // @return {number} Returns the vertical scroll position, or -1 on error.
    scrollToNode(node) {
        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            return -1;
        }
        if (!this.contentElement) {
            return -1;
        }
        // Get the offset height of the first child element that contains the "tree-item" class.
        const firstChild = this.contentElement.querySelectorAll('.tree-item')[0];
        const rowHeight = (firstChild && firstChild.offsetHeight) || 0;
        return this.scrollTop(nodeIndex * rowHeight);
    }
    // Get/set the current vertical position of the scroll bar.
    // @param {number} [value] An integer indicating the new position to set the scroll bar to.
    // @return {number} Returns the vertical scroll position.
    scrollTop(value) {
        if (!this.scrollElement) {
            return 0;
        }
        if (value !== undefined) {
            this.scrollElement.scrollTop = Number(value);
        }
        return this.scrollElement.scrollTop;
    }
    // Select this node. You can deselect the current node by calling selectNode(null) or selectNode().
    // @param {object} node
    // @return {boolean} Returns true on success, false otherwise.
    selectNode(node = null) {
        const { rowRenderer } = this.options;

        if (node === null) {
            // Deselect the current node
            if (this.state.selectedNode) {
                const selectedNode = this.state.selectedNode;
                const selectedIndex = this.nodes.indexOf(selectedNode);

                selectedNode.state.selected = false;
                this.rows[selectedIndex] = rowRenderer(selectedNode);
                this.state.selectedNode = null;

                // Emit the 'selectNode' event
                this.emit('selectNode', null);

                // Updates list with new data
                this.update();

                return true;
            }

            return false;
        }

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node specified: node.id=' + JSON.stringify(node.id));
        }

        // Select this node
        if (this.state.selectedNode !== node) {
            node.state.selected = true;
            this.rows[nodeIndex] = rowRenderer(node);
        }

        // Deselect the current node
        if (this.state.selectedNode) {
            const selectedNode = this.state.selectedNode;
            const selectedIndex = this.nodes.indexOf(selectedNode);
            selectedNode.state.selected = false;
            this.rows[selectedIndex] = rowRenderer(selectedNode);
        }

        if (this.state.selectedNode !== node) {
            this.state.selectedNode = node;

            // Emit the 'selectNode' event
            this.emit('selectNode', node);
        } else {
            this.state.selectedNode = null;

            // Emit the 'selectNode' event
            this.emit('selectNode', null);
        }

        // Updates list with new data
        this.update();

        return true;
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
