import events from 'events';
import Clusterize from 'clusterize.js';
import { flatten, Node } from 'flattree';
import LookupTable from './lookup-table';
import { defaultRowRenderer } from './renderer';
import {
    preventDefault,
    stopPropagation,
    addEventListener,
    removeEventListener,
    classNames,
    addClass,
    removeClass
} from './helper';

const ensureNodeInstance = (node) => {
    if (!(node instanceof Node)) {
        throw new Error('The node must be a Node object.');
    }
    return true;
};

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
        droppable: false,
        el: null,
        loadNodes: null,
        rowRenderer: defaultRowRenderer,
        selectable: true,
        shouldSelectNode: null
    };
    state = {
        openNodes: [],
        rootNode: null,
        selectedNode: null
    };
    clusterize = null;
    nodeTable = new LookupTable();
    nodes = [];
    rows = [];
    scrollElement = null;
    contentElement = null;
    dragoverElement = null;

    contentListener = {
        'click': (e) => {
            let itemTarget = null;
            let handleToggler = false;

            stopPropagation(e);

            if (e.target && e.currentTarget) {
                itemTarget = (e.target !== e.currentTarget) ? e.target : null;
            } else if (e.srcElement) { // IE8
                itemTarget = e.srcElement;
            }

            while (itemTarget && itemTarget.parentElement !== this.contentElement) {
                if (itemTarget.className.indexOf('tree-toggler') >= 0) {
                    handleToggler = true;
                }
                itemTarget = itemTarget.parentElement;
            }

            if (!itemTarget) {
                return;
            }

            const id = itemTarget.getAttribute('aria-id');
            const node = this.getNodeById(id);

            if (!node) {
                return;
            }

            // Click on the toggler to open/close a tree node
            if (handleToggler) {
                this.toggleNode(node);
                return;
            }

            this.selectNode(node);
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragenter
        // The dragenter event is fired when a dragged element or text selection enters a valid drop target.
        'dragenter': (e) => {
            let itemTarget = null;

            if (e.target && e.currentTarget) {
                itemTarget = (e.target !== e.currentTarget) ? e.target : null;
            } else if (e.srcElement) { // IE8
                itemTarget = e.srcElement;
            }

            while (itemTarget && itemTarget.parentElement !== this.contentElement) {
                itemTarget = itemTarget.parentElement;
            }

            if (!itemTarget) {
                return;
            }

            if (this.dragoverElement !== itemTarget) {
                removeClass(this.dragoverElement, 'highlight'); // remove 'highlight' class
                this.dragoverElement = null;

                if (!(itemTarget.hasAttribute('droppable'))) {
                    return;
                }

                const canDrop = !(itemTarget.getAttribute('droppable').match(/false/i));
                if (canDrop) {
                    addClass(itemTarget, 'highlight');
                    this.dragoverElement = itemTarget;
                }
            }
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragend
        // The dragend event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
        'dragend': (e) => {
            if (this.dragoverElement) {
                removeClass(this.dragoverElement, 'highlight'); // remove 'highlight' class
                this.dragoverElement = null;
            }
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragover
        // The dragover event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
        'dragover': (e) => {
            preventDefault(e);
            e.dataTransfer.dropEffect = 'move';
            return false;
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/drop
        // The drop event is fired when an element or text selection is dropped on a valid drop target.
        'drop': (e) => {
            // prevent default action (open as link for some elements)
            preventDefault(e);

            if (this.dragoverElement) {
                const id = this.dragoverElement.getAttribute('aria-id');
                const node = this.getNodeById(id);

                removeClass(this.dragoverElement, 'highlight');
                this.dragoverElement = null;

                this.emit('dropNode', node, e);
            }
        }
    };

    // Creates new InfiniteTree object.
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

        addEventListener(this.contentElement, 'click', this.contentListener.click);
        if (this.options.droppable) {
            addEventListener(document, 'dragend', this.contentListener.dragend);
            addEventListener(this.contentElement, 'dragenter', this.contentListener.dragenter);
            addEventListener(this.contentElement, 'dragover', this.contentListener.dragover);
            addEventListener(this.contentElement, 'drop', this.contentListener.drop);
        }
    }
    destroy() {
        removeEventListener(this.contentElement, 'click', this.contentListener);
        if (this.options.droppable) {
            removeEventListener(document, 'dragend', this.contentListener.dragend);
            removeEventListener(this.contentElement, 'dragenter', this.contentListener.dragenter);
            removeEventListener(this.contentElement, 'dragover', this.contentListener.dragover);
            removeEventListener(this.contentElement, 'drop', this.contentListener.drop);
        }

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
    // Adds an array of new child nodes to a parent node at the specified index.
    // * If the parent is null or undefined, inserts new childs at the specified index in the top-level.
    // * If the parent has children, the method adds the new child to it at the specified index.
    // * If the parent does not have children, the method adds the new child to the parent.
    // * If the index value is greater than or equal to the number of children in the parent, the method adds the child at the end of the children.
    // @param {Array} newNodes An array of new child nodes.
    // @param {number} [index] The 0-based index of where to insert the child node.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {boolean} Returns true on success, false otherwise.
    addChildNodes(newNodes, index, parentNode) {
        newNodes = [].concat(newNodes || []); // Ensure array
        if (newNodes.length === 0) {
            return false;
        }

        if (typeof index === 'object') { // The 'object' type might be Node or null
            parentNode = index || this.state.rootNode; // Defaults to rootNode if not specified
            index = parentNode.children.length;
        } else {
            parentNode = parentNode || this.state.rootNode; // Defaults to rootNode if not specified
        }

        ensureNodeInstance(parentNode);

        // Assign parent
        newNodes.forEach((newNode) => {
            newNode.parent = parentNode;
        });

        // Insert new child node at the specified index
        parentNode.children.splice.apply(parentNode.children, [index, 0].concat(newNodes));

        // Get the index of the first new node within the array of child nodes
        index = parentNode.children.indexOf(newNodes[0]);

        const deleteCount = parentNode.state.total;
        const nodes = flatten(parentNode.children, { openNodes: this.state.openNodes });
        const rows = nodes.map(node => this.options.rowRenderer(node, this.options));

        if (parentNode === this.state.rootNode) {
            this.nodes = nodes;
            this.rows = rows;
        } else {
            const parentOffset = this.nodes.indexOf(parentNode);
            if (parentOffset >= 0) {
                // Update nodes & rows
                this.nodes.splice.apply(this.nodes, [parentOffset + 1, deleteCount].concat(nodes));
                this.rows.splice.apply(this.rows, [parentOffset + 1, deleteCount].concat(rows));

                // Update the row corresponding to the parent node
                this.rows[parentOffset] = this.options.rowRenderer(parentNode, this.options);
            }
        }

        // Update the lookup table with newly added nodes
        parentNode.children.slice(index).forEach((childNode) => {
            this.flattenNode(childNode).forEach((node) => {
                if (node.id !== undefined) {
                    this.nodeTable.set(node.id, node);
                }
            });
        });

        // Updates list with new data
        this.update();

        return true;
    }
    // Adds a new child node to the end of the list of children of a specified parent node.
    // * If the parent is null or undefined, inserts the child at the specified index in the top-level.
    // * If the parent has children, the method adds the child as the last child.
    // * If the parent does not have children, the method adds the child to the parent.
    // @param {Object} newNode The new child node.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {boolean} Returns true on success, false otherwise.
    appendChildNode(newNode, parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;
        ensureNodeInstance(parentNode);
        const index = parentNode.children.length;
        const newNodes = [].concat(newNode || []); // Ensure array
        return this.addChildNodes(newNodes, index, parentNode);
    }
    // Clears the tree.
    clear() {
        this.clusterize.clear();
        this.nodeTable.clear();
        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.rootNode = null;
        this.state.selectedNode = null;
    }
    // Closes a node to hide its children.
    // @param {Node} node The Node object.
    // @return {boolean} Returns true on success, false otherwise.
    closeNode(node) {
        ensureNodeInstance(node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node index');
        }

        // Check if the closeNode action can be performed
        if (this.state.openNodes.indexOf(node) < 0) {
            return false;
        }

        // Keep selected node unchanged if "node" is equal to "this.state.selectedNode"
        if (this.state.selectedNode && (this.state.selectedNode !== node)) {
            // row #0 - node.0         => parent node (total=4)
            // row #1   - node.0.0     => close this node; next selected node (total=2)
            // row #2       node.0.0.0 => selected node (total=0)
            // row #3       node.0.0.1
            // row #4     node.0.1
            const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
            const rangeFrom = nodeIndex + 1;
            const rangeTo = nodeIndex + node.state.total;

            if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                this.selectNode(node);
            }
        }

        node.state.open = false; // Set the open state to false
        const openNodes = this.state.openNodes.filter((node) => (node.hasChildren() && node.state.open));
        this.state.openNodes = openNodes;

        const deleteCount = node.state.total;

        // Subtract the deleteCount for all ancestors (parent, grandparent, etc.) of the current node
        for (let p = node; p !== null; p = p.parent) {
            p.state.total = p.state.total - deleteCount;
        }

        // Update nodes & rows
        this.nodes.splice(nodeIndex + 1, deleteCount);
        this.rows.splice(nodeIndex + 1, deleteCount);

        // Update the row corresponding to the node
        this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

        // Emit the 'closeNode' event
        this.emit('closeNode', node);

        // Updates list with new data
        this.update();

        return true;
    }
    // Flattens all child nodes of a parent node by performing full tree traversal using child-parent link.
    // No recursion or stack is involved.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {array} Returns an array of Node objects containing all the child nodes of the parent node.
    flattenChildNodes(parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;

        ensureNodeInstance(parentNode);

        const list = [];

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
    // Flattens a node by performing full tree traversal using child-parent link.
    // No recursion or stack is involved.
    // @param {Node} node The Node object.
    // @return {array} Returns a flattened list of Node objects.
    flattenNode(node) {
        return [node].concat(this.flattenChildNodes(node));
    }
    // Gets a list of child nodes.
    // @param {Node} [parentNode] The Node object that defines the parent node. If null or undefined, returns a list of top level nodes.
    // @return {array} Returns an array of Node objects containing all the child nodes of the parent node.
    getChildNodes(parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;

        ensureNodeInstance(parentNode);

        return parentNode.children;
    }
    // Gets a node by its unique id. This assumes that you have given the nodes in the data a unique id.
    // @param {string|number} id An unique node id. A null value will be returned if the id doesn't match.
    // @return {Node} Returns a node the matches the id, null otherwise.
    getNodeById(id) {
        let node = this.nodeTable.get(id);
        if (!node) {
            // Find the first node that matches the id
            node = this.nodes.filter((node) => (node.id === id))[0];
            if (!node) {
                return null;
            }
            this.nodeTable.set(node.id, node);
        }
        return node;
    }
    // Gets an array of open nodes.
    // @return {array} Returns an array of Node objects containing open nodes.
    getOpenNodes() {
        // returns a shallow copy of an array into a new array object.
        return this.state.openNodes.slice();
    }
    // Gets the root node.
    // @return {Node} Returns the root node, or null if empty.
    getRootNode() {
        return this.state.rootNode;
    }
    // Gets the selected node.
    // @return {Node} Returns the selected node, or null if not selected.
    getSelectedNode() {
        return this.state.selectedNode;
    }
    // Inserts the specified node after the reference node.
    // @param {Object} newNode The new sibling node.
    // @param {Node} referenceNode The Node object that defines the reference node.
    // @return {boolean} Returns true on success, false otherwise.
    insertNodeAfter(newNode, referenceNode) {
        ensureNodeInstance(referenceNode);
        const parentNode = referenceNode.getParent();
        const index = parentNode.children.indexOf(referenceNode) + 1;
        const newNodes = [].concat(newNode || []); // Ensure array
        return this.addChildNodes(newNodes, index, parentNode);
    }
    // Inserts the specified node before the reference node.
    // @param {Object} newNode The new sibling node.
    // @param {Node} referenceNode The Node object that defines the reference node.
    // @return {boolean} Returns true on success, false otherwise.
    insertNodeBefore(newNode, referenceNode) {
        ensureNodeInstance(referenceNode);
        const parentNode = referenceNode.getParent();
        const index = parentNode.children.indexOf(referenceNode);
        const newNodes = [].concat(newNode || []); // Ensure array
        return this.addChildNodes(newNodes, index, parentNode);
    }
    // Loads data in the tree.
    // @param {object|array} data The data is an object or array of objects that defines the node.
    loadData(data = []) {
        this.nodes = flatten(data, { openAllNodes: this.options.autoOpen });

        // Clear lookup table
        this.nodeTable.clear();

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
        this.flattenChildNodes(this.state.rootNode).forEach((node) => {
            if (node.id !== undefined) {
                this.nodeTable.set(node.id, node);
            }
        });

        // Update rows
        this.rows = this.nodes.map(node => this.options.rowRenderer(node, this.options));

        // Updates list with new data
        this.update();
    }
    // Opens a node to display its children.
    // @param {Node} node The Node object.
    // @return {boolean} Returns true on success, false otherwise.
    openNode(node) {
        ensureNodeInstance(node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node index');
        }

        // Check if the openNode action can be performed
        if (this.state.openNodes.indexOf(node) >= 0) {
            return false;
        }

        if (!node.hasChildren() && node.loadOnDemand) {
            if (typeof this.options.loadNodes !== 'function') {
                return false;
            }

            // Set loading state to true
            node.state.loading = true;
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

            // Updates list with new data
            this.update();

            this.options.loadNodes(node, (err, nodes) => {
                // Set loading state to false
                node.state.loading = false;
                this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

                // Updates list with new data
                this.update();

                if (err) {
                    return;
                }

                // Append child nodes
                nodes.forEach((childNode) => {
                    this.appendChildNode(childNode, node);
                });

                // Call openNode again
                this.openNode(node);
            });

            return false;
        }

        node.state.open = true; // Set node.state.open to true
        const openNodes = [node].concat(this.state.openNodes); // the most recently used items first
        this.state.openNodes = openNodes;

        const nodes = flatten(node.children, { openNodes: this.state.openNodes });
        const rows = nodes.map(node => this.options.rowRenderer(node, this.options));

        // Update nodes & rows
        this.nodes.splice.apply(this.nodes, [nodeIndex + 1, 0].concat(nodes));
        this.rows.splice.apply(this.rows, [nodeIndex + 1, 0].concat(rows));

        // Update the row corresponding to the node
        this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

        // Add all child nodes to the lookup table if the first child does not exist in the lookup table
        if ((nodes.length > 0) && !(this.nodeTable.get(nodes[0]))) {
            nodes.forEach((node) => {
                if (node.id !== undefined) {
                    this.nodeTable.set(node.id, node);
                }
            });
        }

        // Emit the 'openNode' event
        this.emit('openNode', node);

        // Updates list with new data
        this.update();

        return true;
    }
    // Removes all child nodes from a parent node.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {boolean} Returns true on success, false otherwise.
    removeChildNodes(parentNode) {
        ensureNodeInstance(parentNode);

        if (parentNode.children.length === 0) {
            return false;
        }

        const parentNodeIndex = this.nodes.indexOf(parentNode);

        // Update selected node
        if ((parentNodeIndex >= 0) && this.state.selectedNode) {
            // row #0 - node.0         => parent node (total=4)
            // row #1   - node.0.0
            // row #2       node.0.0.0 => current selected node
            // row #3       node.0.0.1
            // row #4     node.0.1
            const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
            const rangeFrom = parentNodeIndex + 1;
            const rangeTo = parentNodeIndex + parentNode.state.total;

            if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                this.selectNode(parentNode);
            }
        }

        // Update parent node
        parentNode.children = [];
        parentNode.state.open = parentNode.state.open && (parentNode.children.length > 0);

        // Get the number of nodes to be removed
        const deleteCount = parentNode.state.total;

        // Subtract the deleteCount for all ancestors (parent, grandparent, etc.) of the current node
        for (let p = parentNode; p !== null; p = p.parent) {
            p.state.total = p.state.total - deleteCount;
        }

        if (parentNodeIndex >= 0) {
            // Update nodes & rows
            this.nodes.splice(parentNodeIndex + 1, deleteCount);
            this.rows.splice(parentNodeIndex + 1, deleteCount);

            // Update the row corresponding to the parent node
            this.rows[parentNodeIndex] = this.options.rowRenderer(parentNode, this.options);
        }

        { // Update open nodes and lookup table
            const childNodes = this.flattenChildNodes(parentNode);

            this.state.openNodes = this.state.openNodes.filter((node) => {
                return childNodes.indexOf(node) < 0;
            });

            childNodes.forEach((node) => {
                this.nodeTable.unset(node.id);
            });
        }

        // Updates list with new data
        this.update();

        return true;
    }
    // Removes a node and all of its child nodes.
    // @param {Node} node The Node object.
    // @return {boolean} Returns true on success, false otherwise.
    removeNode(node) {
        ensureNodeInstance(node);

        const parentNode = node.parent;
        if (!parentNode) {
            return false;
        }

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        const parentNodeIndex = this.nodes.indexOf(parentNode);

        // Update selected node
        if ((nodeIndex >= 0) && this.state.selectedNode) {
            // row #0 - node.0         => parent node (total=4)
            // row #1   - node.0.0     => remove this node (total=2)
            // row #2       node.0.0.0 => current selected node (total=0)
            // row #3       node.0.0.1
            // row #4     node.0.1     => next selected node (total=0)
            const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
            const rangeFrom = nodeIndex;
            const rangeTo = nodeIndex + node.state.total + 1;

            if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                // Change the selected node in the following order:
                // 1. next sibling node
                // 2. previous sibling node
                // 3. parent node
                const selectedNode = node.getNextSibling() || node.getPreviousSibling() || node.getParent();
                this.selectNode(selectedNode);
            }
        }

        // Update parent node
        parentNode.children.splice(parentNode.children.indexOf(node), 1);
        parentNode.state.open = parentNode.state.open && (parentNode.children.length > 0);

        // Get the number of nodes to be removed
        const deleteCount = node.state.total + 1;

        // Subtract the deleteCount for all ancestors (parent, grandparent, etc.) of the current node
        for (let p = parentNode; p !== null; p = p.parent) {
            p.state.total = p.state.total - deleteCount;
        }

        if (nodeIndex >= 0) {
            // Update nodes & rows
            this.nodes.splice(nodeIndex, deleteCount);
            this.rows.splice(nodeIndex, deleteCount);
        }

        // Update the row corresponding to the parent node
        if (parentNodeIndex >= 0) {
            this.rows[parentNodeIndex] = this.options.rowRenderer(parentNode, this.options);
        }

        { // Update open nodes and lookup table
            const nodes = this.flattenNode(node);

            this.state.openNodes = this.state.openNodes.filter((node) => {
                return nodes.indexOf(node) < 0;
            });

            nodes.forEach((node) => {
                this.nodeTable.unset(node.id);
            });
        }

        // Updates list with new data
        this.update();

        return true;
    }
    // Sets the current scroll position to this node.
    // @param {Node} node The Node object.
    // @return {number} Returns the vertical scroll position, or -1 on error.
    scrollToNode(node) {
        ensureNodeInstance(node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            return -1;
        }
        if (!this.contentElement) {
            return -1;
        }
        // Get the offset height of the first child element that contains the "tree-item" class
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
    // @param {Node} node The Node object. If null or undefined, deselects the current node.
    // @return {boolean} Returns true on success, false otherwise.
    selectNode(node = null) {
        const { selectable, shouldSelectNode } = this.options;

        if (!selectable) {
            return false;
        }
        if ((typeof shouldSelectNode === 'function') && !shouldSelectNode(node)) {
            return false;
        }

        if (node === null) {
            // Deselect the current node
            if (this.state.selectedNode) {
                const selectedNode = this.state.selectedNode;
                const selectedIndex = this.nodes.indexOf(selectedNode);

                selectedNode.state.selected = false;
                this.rows[selectedIndex] = this.options.rowRenderer(selectedNode, this.options);
                this.state.selectedNode = null;

                // Emit the 'selectNode' event
                this.emit('selectNode', null);

                // Updates list with new data
                this.update();

                return true;
            }

            return false;
        }

        ensureNodeInstance(node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            throw new Error('Invalid node index');
        }

        // Select this node
        if (this.state.selectedNode !== node) {
            node.state.selected = true;

            // Update the row corresponding to the node
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);
        }

        // Deselect the current node
        if (this.state.selectedNode) {
            const selectedNode = this.state.selectedNode;
            const selectedIndex = this.nodes.indexOf(selectedNode);
            selectedNode.state.selected = false;
            this.rows[selectedIndex] = this.options.rowRenderer(selectedNode, this.options);
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
    // @param {Node} node The Node object.
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
    // @param {Node} node The Node object. If null, returns the whole tree.
    // @return {string} Returns a JSON string represented the tree.
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
    // Updates the tree.
    update() {
        // Update the list with new data
        this.clusterize.update(this.rows);

        // Emit the 'update' event
        this.emit('update');
    }
    // Updates the data of a node.
    // @param {Node} node The Node object.
    // @param {Object} data The data object.
    updateNode(node, data) {
        ensureNodeInstance(node);

        // The static attributes (i.e. children, parent, and state) are being protected
        const { children, parent, state } = node;
        node = extend(node, data, { children, parent, state });

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex >= 0) {
            // Update the row corresponding to the node
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

            // Updates list with new data
            this.update();
        }
    }
}

export default InfiniteTree;
