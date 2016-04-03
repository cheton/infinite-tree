import events from 'events';
import Clusterize from 'clusterize.js';
import { flatten } from 'flattree';
import LookupTable from './lookup-table';
import { defaultRowRenderer } from './renderer';
import { stopPropagation, addEventListener, removeEventListener } from './polyfill';
import { classNames } from './utils';

const extend = (target, ...sources) => {
    if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    const output = Object(target);
    for (let index = 0; index < sources.length; index++) {
        const source = sources[index];
        if (source !== undefined && source !== null) {
            for (let key in source) {
                if (source.hasOwnProperty(key)) {
                    output[key] = source[key];
                }
            }
        }
    }
    return output;
};

class InfiniteTree extends events.EventEmitter {
    options = {
        autoOpen: false,
        el: null,
        rowRenderer: defaultRowRenderer
    };
    state = {
        openNodes: [],
        rootNode: null,
        selectedNode: null
    };
    clusterize = null;
    tbl = new LookupTable();
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

            if (!node) {
                return;
            }

            // Click on the toggler to open/close a tree node
            if (handleToggler) {
                this.toggleNode(node);
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
    clear() {
        this.clusterize.clear();
        this.tbl.clear();
        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.rootNode = null;
        this.state.selectedNode = null;
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
    // Updates list with new data
    update() {
        this.clusterize.update(this.rows);
    }
    // Inserts a new child node to a parent node at the specified index.
    // * If the parent is null or undefined, inserts the child at the specified index in the top-level.
    // * If the parent has children, the method adds the child to it at the specified index.
    // * If the parent does not have children, the method adds the child to the parent.
    // * If the index value is greater than or equal to the number of children in the parent, the method adds the child at the end of the children.
    // @param {object} newNode The object that defines the new child node.
    // @param {number} [index] The 0-based index of where to insert the child node. Defaults to 0.
    // @param {object} parentNode The object that defines the parent node.
    addChildNodeAt(newNode, index, parentNode) {
        // Defaults to rootNode if parentNode is not specified
        parentNode = parentNode || this.state.rootNode;
        if (!(parentNode instanceof Node)) {
            throw new Error('The parent node must be a Node object.');
        }

        const { rowRenderer } = this.options;

        if (!newNode) {
            return false;
        }
        index = Number(index) || 0;
        if (index < 0) {
            index = 0;
        }

        // Inserts the new child at the specified index
        newNode.parent = parentNode;
        parentNode.children.splice(index, 0, newNode);

        const deleteCount = parentNode.state.total;

        // Update index
        index = parentNode.children.indexOf(newNode);

        const nodes = flatten(parentNode.children, { openNodes: this.state.openNodes });

        // Update newNode
        newNode = parentNode.getChildAt(index);

        // Update nodes & rows
        const rows = nodes.map(node => rowRenderer(node));
        const parentOffset = this.nodes.indexOf(parentNode);
        this.nodes.splice.apply(this.nodes, [parentOffset + 1, deleteCount].concat(nodes));
        this.rows.splice.apply(this.rows, [parentOffset + 1, deleteCount].concat(rows));

        // Update the lookup table with newly added nodes
        this.tbl.set(newNode.id, newNode);
        this.flatten(newNode).forEach((node) => {
            if (node.id !== undefined) {
                this.tbl.set(node.id, node);
            }
        });

        // Update the row corresponding to the parent node
        this.rows[parentOffset] = rowRenderer(parentNode);

        // Updates list with new data
        this.update();

        return true;
    }
    // Adds a node to the end of the list of children of a specified parent node.
    // * If the parent is null or undefined, inserts the child at the specified index in the top-level.
    // * If the parent has children, the method adds the child as the last child.
    // * If the parent does not have children, the method adds the child to the parent.
    // @param {object} newNode The object that defines the new child node.
    // @param {object} parentNode The object that defines the parent node.
    // @return {boolean} Returns true on success, false otherwise.
    appendChildNode(newNode, parentNode) {
        // Defaults to rootNode if parentNode is not specified
        parentNode = parentNode || this.state.rootNode;
        if (!(parentNode instanceof Node)) {
            throw new Error('The parent node must be a Node object.');
        }

        const index = parentNode.children.length;
        return this.addChildNodeAt(newNode, index, parentNode);
    }
    // Inserts the specified node after the reference node.
    // @param {object} newNode The object that defines the new sibling node.
    // @param {object} referenceNode The object that defines the current node.
    insertNodeAfter(newNode, referenceNode) {
        if (!(referenceNode instanceof Node)) {
            throw new Error('The reference node must be a Node object.');
        }

        const parentNode = referenceNode.getParent();
        const index = parentNode.children.indexOf(referenceNode) + 1;
        return this.addChildNodeAt(newNode, index, parentNode);
    }
    // Inserts the specified node before the reference node.
    // @param {object} newNode The object that defines the new sibling node.
    // @param {object} referenceNode The object that defines the current node.
    insertNodeBefore(newNode, referenceNode) {
        if (!(referenceNode instanceof Node)) {
            throw new Error('The reference node must be a Node object.');
        }

        const parentNode = referenceNode.getParent();
        const index = parentNode.children.indexOf(referenceNode);
        return this.addChildNodeAt(newNode, index, parentNode);
    }
    // Closes a node to hide its children.
    // @param {object} node The object that defines the node.
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
        const openNodes = this.state.openNodes.filter((node) => (node.hasChildren() && node.state.open));
        this.state.openNodes = openNodes;

        const deleteCount = node.state.total;

        { // Traversing up through ancestors to subtract node.state.total.
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
    // Gets a list of child nodes.
    // @param {object} [node] The object that defines the node. If null or undefined, returns a list of top level nodes.
    // @return {array} Returns an array of child nodes.
    getChildNodes(node = null) {
        if (node) {
            return node.children || [];
        }
        node = (this.nodes.length > 0) ? this.nodes[0] : null;
        while (node && node.parent !== null) {
            node = node.parent;
        }
        return (node && node.children) || [];
    }
    // Gets a node by its unique id. This assumes that you have given the nodes in the data a unique id.
    // @param {string|number} id An unique node id. A null value will be returned if the id doesn't match.
    // @return {object} Returns the node the matches the id, null otherwise.
    getNodeById(id) {
        let node = this.tbl.get(id);
        if (!node) {
            // Find the first node that matches the id
            node = this.nodes.filter((node) => (node.id === id))[0];
            if (!node) {
                return null;
            }
            this.tbl.set(node.id, node);
        }
        return node;
    }
    // Gets the selected node.
    // @return {object} Returns the selected node, or null if not selected.
    getSelectedNode() {
        return this.state.selectedNode;
    }
    // Gets an array of open nodes.
    // @return {array} Returns an array of open nodes.
    getOpenNodes() {
        // returns a shallow copy of an array into a new array object.
        return this.state.openNodes.slice();
    }
    // Loads data in the tree.
    // @param {object|array} data The data is an object or array of objects that defines the node.
    loadData(data = []) {
        const { autoOpen, rowRenderer } = this.options;

        this.nodes = flatten(data, { openAllNodes: autoOpen });

        // Clear lookup table
        this.tbl.clear();

        this.state.openNodes = this.nodes.filter((node) => (node.hasChildren() && node.state.open));
        this.state.rootNode = ((node = null) => {
            // Finding the root node
            while (node && node.parent !== null) {
                node = node.parent;
            }
            return node;
        })(this.nodes[0]);
        this.state.selectedNode = null;

        // Update the lookup table with newly added nodes
        this.flatten(this.state.rootNode).forEach((node) => {
            if (node.id !== undefined) {
                this.tbl.set(node.id, node);
            }
        });

        // Update rows
        this.rows = this.nodes.map(node => rowRenderer(node));

        // Updates list with new data
        this.update();
    }
    // Opens a node to display its children.
    // @param {object} node The object that defines the node.
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

        // Add all child nodes to the lookup table if the first child does not exist in the lookup table
        if ((nodes.length > 0) && !(this.tbl.get(nodes[0]))) {
            nodes.forEach((node) => {
                if (node.id !== undefined) {
                    this.tbl.set(node.id, node);
                }
            });
        }

        // Emit the 'openNode' event
        this.emit('openNode', node);

        // Updates list with new data
        this.update();

        return true;
    }
    // Removes a node.
    // @param {object} node The object that defines the node.
    removeNode(node) {
        // TODO
    }
    // Sets the current scroll position to this node.
    // @param {object} node The object that defines the node.
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
    // Gets (or sets) the current vertical position of the scroll bar.
    // @param {number} [value] An integer that indicates the new position to set the scroll bar to.
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
    // Selects a node.
    // @param {object} node The object that defines the node. If null or undefined, deselects the current node.
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
    // Toggles a node to display or hide its children.
    // @param {object} node The object that defines the node.
    toggleNode(node) {
        if (this.state.openNodes.indexOf(node) >= 0) {
            // close node
            this.closeNode(node);
        } else {
            // open node
            this.openNode(node);
        }
    }
    // Serializes the current state of a node to a JSON string.
    // @param {object} node The object that defines the node. If null, returns the whole tree.
    toString(node = null) {
        const traverse = (node) => {
            let s = '[';
            if (node && node.children) {
                for (let i = 0; i < node.children.length; ++i) {
                    let list = [];
                    s = s + '{';
                    Object.keys(node).forEach((key) => {
                        let value = node[key];
                        if (key === 'parent') { // ignore parent
                            return;
                        }
                        if (key === 'children') { // traverse child nodes
                            list.push('"' + key + '":' + traverse(node.children[i]));
                            return;
                        }
                        if (typeof value === 'string' || typeof value === 'object') {
                            list.push('"' + key + '":' + JSON.stringify(value));
                        } else { // primitive types
                            list.push('"' + key + '":' + value);
                        }
                    });
                    s = s + list.join(',');
                    s = s + '}' + ((i === node.children.length - 1) ? '' : ',');
                }
            }
            s = s + ']';
            return s;
        };

        if (!node) {
            node = this.state.rootNode;
        }

        return traverse(node);
    }
    // Flattens parent-child nodes by performing full tree traversal using child-parent link.
    // No recursion or stack is involved.
    // @param {object} parentNode The object that defines the parent node.
    // @return {array} Returns a flattened list of child nodes, not including the parent node.
    flatten(parentNode) {
        const list = [];

        if (parentNode === undefined) {
            parentNode = this.state.rootNode;
        }

        // Ignore parent node
        let node = parentNode.getFirstChild();
        while (node) {
            list.push(node);
            if (node.hasChildren()) {
                node = node.getFirstChild();
            } else {
                // find the parent level
                while ((node.getNextSibling() === null) && (node.parent !== parentNode)) {
                    // use child-parent link to get to the parent level
                    node = node.getParent();
                }

                // Get next sibling
                node = node.getNextSibling();
            }
        }

        return list;
    }
    // Updates the data of a node.
    // @param {object} node
    // @param {object} data The data object.
    updateNode(node, data) {
        const { rowRenderer } = this.options;

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node specified: node.id=' + JSON.stringify(node.id));
        }

        // The static attributes (i.e. children, parent, and state) are being protected
        const { children, parent, state } = node;
        node = extend(node, data, { children, parent, state });

        this.rows[nodeIndex] = rowRenderer(node);

        // Updates list with new data
        this.update();
    }
}

module.exports = InfiniteTree;
