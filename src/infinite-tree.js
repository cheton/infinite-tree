/* eslint no-continue: 0 */
/* eslint operator-assignment: 0 */
import events from 'events';
import classNames from 'classnames';
import elementClass from 'element-class';
import isDOM from 'is-dom';
import { flatten, Node } from 'flattree';
import Clusterize from './clusterize';
import ensureArray from './ensure-array';
import extend from './extend';
import { get } from './utilities';
import LookupTable from './lookup-table';
import { defaultRowRenderer } from './renderer';
import {
    preventDefault,
    addEventListener,
    removeEventListener
} from './dom';

const noop = () => {};

const error = (format, ...args) => {
    let argIndex = 0;
    const message = 'Error: ' + format.replace(/%s/g, () => {
        return args[argIndex++];
    });

    if (console && console.error) {
        console.error(message);
    }
    try {
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this error to fire.
        throw new Error(message);
    } catch (e) {
        // Ignore
    }
};

const ensureNodeInstance = (node) => {
    if (!node) { // undefined or null
        return false;
    }
    if (!(node instanceof Node)) {
        error('The node must be a Node object.');
        return false;
    }
    return true;
};

const createRootNode = (rootNode) => {
    return extend(rootNode || new Node(), {
        parent: null,
        children: [],
        state: {
            depth: -1,
            open: true, // always open
            path: '',
            prefixMask: '',
            total: 0
        }
    });
};

class InfiniteTree extends events.EventEmitter {
    options = {
        autoOpen: false,
        droppable: false,
        shouldLoadNodes: null,
        loadNodes: null,
        rowRenderer: defaultRowRenderer,
        selectable: true,
        shouldSelectNode: null,

        // When el is not specified, the tree will run in the stealth mode
        el: null,

        // The following options will have no effect in the stealth mode
        layout: 'div',
        noDataClass: 'infinite-tree-no-data',
        noDataText: 'No data',
        nodeIdAttr: 'data-id',
        togglerClass: 'infinite-tree-toggler'
    };
    state = {
        openNodes: [],
        rootNode: createRootNode(),
        selectedNode: null
    };
    clusterize = null;
    nodeTable = new LookupTable();
    nodes = [];
    rows = [];
    filtered = false;

    // The following elements will have no effect in the stealth mode
    scrollElement = null;
    contentElement = null;
    draggableTarget = null;
    droppableTarget = null;

    contentListener = {
        'click': (event) => {
            event = event || window.event;

            // Wrap stopPropagation that allows click event handler to stop execution
            // by setting the cancelBubble property
            const stopPropagation = event.stopPropagation;
            event.stopPropagation = function() {
                // Setting the cancelBubble property in browsers that don't support it doesn't hurt.
                // Of course it doesn't actually cancel the bubbling, but the assignment itself is safe.
                event.cancelBubble = true;

                if (stopPropagation) {
                    stopPropagation.call(event);
                }
            };

            // Call setTimeout(fn, 0) to re-queues the execution of subsequent calls, it allows the
            // click event to bubble up to higher level event handlers before handling tree events.
            setTimeout(() => {
                // Stop execution if the cancelBubble property is set to true by higher level event handlers
                if (event.cancelBubble === true) {
                    return;
                }

                // Emit a "click" event
                this.emit('click', event);

                // Stop execution if the cancelBubble property is set to true after emitting the click event
                if (event.cancelBubble === true) {
                    return;
                }

                let itemTarget = null;
                let clickToggler = false;

                if (event.target) {
                    itemTarget = (event.target !== event.currentTarget) ? event.target : null;
                } else if (event.srcElement) { // IE8
                    itemTarget = event.srcElement;
                }

                while (itemTarget && itemTarget.parentElement !== this.contentElement) {
                    if (elementClass(itemTarget).has(this.options.togglerClass)) {
                        clickToggler = true;
                    }
                    itemTarget = itemTarget.parentElement;
                }

                if (!itemTarget || itemTarget.hasAttribute('disabled')) {
                    return;
                }

                const id = itemTarget.getAttribute(this.options.nodeIdAttr);
                const node = this.getNodeById(id);
                if (!node) {
                    return;
                }

                // Click on the toggler to open/close a tree node
                if (clickToggler) {
                    this.toggleNode(node, { async: true });
                    return;
                }

                this.selectNode(node); // selectNode will re-render the tree
            }, 0);
        },
        'dblclick': (event) => {
            // Emit a "doubleClick" event
            this.emit('doubleClick', event);
        },
        'keydown': (event) => {
            // Emit a "keyDown" event
            this.emit('keyDown', event);
        },
        'keyup': (event) => {
            // Emit a "keyUp" event
            this.emit('keyUp', event);
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragstart
        // The dragstart event is fired when the user starts dragging an element or text selection.
        'dragstart': (event) => {
            event = event || window.event;

            this.draggableTarget = event.target || event.srcElement;
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragend
        // The dragend event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
        'dragend': (event) => {
            event = event || window.event;

            const { hoverClass = '' } = this.options.droppable;

            // Draggable
            this.draggableTarget = null;

            // Droppable
            if (this.droppableTarget) {
                elementClass(this.droppableTarget).remove(hoverClass);
                this.droppableTarget = null;
            }
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragenter
        // The dragenter event is fired when a dragged element or text selection enters a valid drop target.
        'dragenter': (event) => {
            event = event || window.event;

            let itemTarget = null;

            if (event.target) {
                itemTarget = (event.target !== event.currentTarget) ? event.target : null;
            } else if (event.srcElement) { // IE8
                itemTarget = event.srcElement;
            }

            while (itemTarget && itemTarget.parentElement !== this.contentElement) {
                itemTarget = itemTarget.parentElement;
            }

            if (!itemTarget) {
                return;
            }

            if (this.droppableTarget === itemTarget) {
                return;
            }

            const { accept, hoverClass = '' } = this.options.droppable;

            elementClass(this.droppableTarget).remove(hoverClass);
            this.droppableTarget = null;

            let canDrop = true; // Defaults to true

            if (typeof accept === 'function') {
                const id = itemTarget.getAttribute(this.options.nodeIdAttr);
                const node = this.getNodeById(id);

                canDrop = !!accept.call(this, event, {
                    type: 'dragenter',
                    draggableTarget: this.draggableTarget,
                    droppableTarget: itemTarget,
                    node: node
                });
            }

            if (canDrop) {
                elementClass(itemTarget).add(hoverClass);
                this.droppableTarget = itemTarget;
            }
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/dragover
        // The dragover event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
        'dragover': (event) => {
            event = event || window.event;

            preventDefault(event);
        },
        // https://developer.mozilla.org/en-US/docs/Web/Events/drop
        // The drop event is fired when an element or text selection is dropped on a valid drop target.
        'drop': (event) => {
            event = event || window.event;

            // prevent default action (open as link for some elements)
            preventDefault(event);

            if (!(this.draggableTarget && this.droppableTarget)) {
                return;
            }

            const { accept, drop, hoverClass = '' } = this.options.droppable;
            const id = this.droppableTarget.getAttribute(this.options.nodeIdAttr);
            const node = this.getNodeById(id);

            let canDrop = true; // Defaults to true

            if (typeof accept === 'function') {
                canDrop = !!accept.call(this, event, {
                    type: 'drop',
                    draggableTarget: this.draggableTarget,
                    droppableTarget: this.droppableTarget,
                    node: node
                });
            }

            if (canDrop && typeof drop === 'function') {
                drop.call(this, event, {
                    draggableTarget: this.draggableTarget,
                    droppableTarget: this.droppableTarget,
                    node: node
                });
            }

            elementClass(this.droppableTarget).remove(hoverClass);
            this.droppableTarget = null;
        }
    };

    // Creates new InfiniteTree object.
    constructor(el, options) {
        super();

        if (isDOM(el)) {
            options = { ...options, el };
        } else if (el && typeof el === 'object') {
            options = el;
        }

        // Assign options
        this.options = {
            ...this.options,
            ...options
        };

        this.create();

        // Load tree data if it's provided
        if (this.options.data) {
            this.loadData(this.options.data);
        }
    }
    create() {
        if (this.options.el) {
            let tag = null;

            this.scrollElement = document.createElement('div');

            if (this.options.layout === 'table') {
                const tableElement = document.createElement('table');
                tableElement.className = classNames(
                    'infinite-tree',
                    'infinite-tree-table'
                );
                const contentElement = document.createElement('tbody');
                tableElement.appendChild(contentElement);
                this.scrollElement.appendChild(tableElement);
                this.contentElement = contentElement;

                // The tag name for supporting elements
                tag = 'tr';
            } else {
                const contentElement = document.createElement('div');
                this.scrollElement.appendChild(contentElement);
                this.contentElement = contentElement;

                // The tag name for supporting elements
                tag = 'div';
            }

            this.scrollElement.className = classNames(
                'infinite-tree',
                'infinite-tree-scroll'
            );
            this.contentElement.className = classNames(
                'infinite-tree',
                'infinite-tree-content'
            );

            this.options.el.appendChild(this.scrollElement);

            this.clusterize = new Clusterize({
                tag: tag,
                rows: [],
                scrollElement: this.scrollElement,
                contentElement: this.contentElement,
                emptyText: this.options.noDataText,
                emptyClass: this.options.noDataClass
            });

            this.clusterize.on('clusterWillChange', () => {
                this.emit('clusterWillChange');
            });
            this.clusterize.on('clusterDidChange', () => {
                this.emit('clusterDidChange');
            });

            addEventListener(this.contentElement, 'click', this.contentListener.click);
            addEventListener(this.contentElement, 'dblclick', this.contentListener.dblclick);
            addEventListener(this.contentElement, 'keydown', this.contentListener.keydown);
            addEventListener(this.contentElement, 'keyup', this.contentListener.keyup);

            if (this.options.droppable) {
                addEventListener(document, 'dragstart', this.contentListener.dragstart);
                addEventListener(document, 'dragend', this.contentListener.dragend);
                addEventListener(this.contentElement, 'dragenter', this.contentListener.dragenter);
                addEventListener(this.contentElement, 'dragleave', this.contentListener.dragleave);
                addEventListener(this.contentElement, 'dragover', this.contentListener.dragover);
                addEventListener(this.contentElement, 'drop', this.contentListener.drop);
            }
        }
    }
    destroy() {
        this.clear();

        if (this.options.el) {
            removeEventListener(this.contentElement, 'click', this.contentListener.click);
            removeEventListener(this.contentElement, 'dblclick', this.contentListener.dblclick);
            removeEventListener(this.contentElement, 'keydown', this.contentListener.keydown);
            removeEventListener(this.contentElement, 'keyup', this.contentListener.keyup);

            if (this.options.droppable) {
                removeEventListener(document, 'dragstart', this.contentListener.dragstart);
                removeEventListener(document, 'dragend', this.contentListener.dragend);
                removeEventListener(this.contentElement, 'dragenter', this.contentListener.dragenter);
                removeEventListener(this.contentElement, 'dragleave', this.contentListener.dragleave);
                removeEventListener(this.contentElement, 'dragover', this.contentListener.dragover);
                removeEventListener(this.contentElement, 'drop', this.contentListener.drop);
            }

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

            const containerElement = this.options.el;
            while (containerElement.firstChild) {
                containerElement.removeChild(containerElement.firstChild);
            }

            this.contentElement = null;
            this.scrollElement = null;
        }
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

        if (!ensureNodeInstance(parentNode)) {
            return false;
        }

        if (typeof index !== 'number') {
            index = parentNode.children.length;
        }

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
        const rows = [];
        // Update rows
        rows.length = nodes.length;
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            rows[i] = this.options.rowRenderer(node, this.options);
        }

        if (parentNode === this.state.rootNode) {
            this.nodes = nodes;
            this.rows = rows;
        } else {
            const parentOffset = this.nodes.indexOf(parentNode);
            if (parentOffset >= 0) {
                if (parentNode.state.open === true) {
                    // Update nodes & rows
                    this.nodes.splice.apply(this.nodes, [parentOffset + 1, deleteCount].concat(nodes));
                    this.rows.splice.apply(this.rows, [parentOffset + 1, deleteCount].concat(rows));
                }

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

        // Update list
        this.update();

        return true;
    }
    // Adds a new child node to the end of the list of children of a specified parent node.
    // * If the parent is null or undefined, inserts the child at the specified index in the top-level.
    // * If the parent has children, the method adds the child as the last child.
    // * If the parent does not have children, the method adds the child to the parent.
    // @param {object} newNode The new child node.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {boolean} Returns true on success, false otherwise.
    appendChildNode(newNode, parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;

        if (!ensureNodeInstance(parentNode)) {
            return false;
        }

        const index = parentNode.children.length;
        const newNodes = [].concat(newNode || []); // Ensure array
        return this.addChildNodes(newNodes, index, parentNode);
    }
    // Checks or unchecks a node.
    // @param {Node} node The Node object.
    // @param {boolean} [checked] Whether to check or uncheck the node. If not specified, it will toggle between checked and unchecked state.
    // @return {boolean} Returns true on success, false otherwise.
    // @example
    //
    // tree.checkNode(node); // toggle checked and unchecked state
    // tree.checkNode(node, true); // checked=true, indeterminate=false
    // tree.checkNode(node, false); // checked=false, indeterminate=false
    //
    // @doc
    //
    // state.checked | state.indeterminate | description
    // ------------- | ------------------- | -----------
    // false         | false               | The node and all of its children are unchecked.
    // true          | false               | The node and all of its children are checked.
    // true          | true                | The node will appear as indeterminate when the node is checked and some (but not all) of its children are checked.
    checkNode(node, checked) {
        if (!ensureNodeInstance(node)) {
            return false;
        }

        this.emit('willCheckNode', node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            error('Invalid node index');
            return false;
        }

        if (checked === true) {
            node.state.checked = true;
            node.state.indeterminate = false;
        } else if (checked === false) {
            node.state.checked = false;
            node.state.indeterminate = false;
        } else {
            node.state.checked = !!node.state.checked;
            node.state.indeterminate = !!node.state.indeterminate;
            node.state.checked = (node.state.checked && node.state.indeterminate) || (!node.state.checked);
            node.state.indeterminate = false;
        }

        let topmostNode = node;

        const updateChildNodes = (parentNode) => {
            let childNode = parentNode.getFirstChild(); // Ignore parent node
            while (childNode) {
                // Update checked and indeterminate state
                childNode.state.checked = parentNode.state.checked;
                childNode.state.indeterminate = false;

                if (childNode.hasChildren()) {
                    childNode = childNode.getFirstChild();
                } else {
                    // Find the parent level
                    while ((childNode.getNextSibling() === null) && (childNode.parent !== parentNode)) {
                        // Use child-parent link to get to the parent level
                        childNode = childNode.getParent();
                    }

                    // Get next sibling
                    childNode = childNode.getNextSibling();
                }
            }
        };

        const updateParentNodes = (childNode) => {
            let parentNode = childNode.parent;

            while (parentNode && parentNode.state.depth >= 0) {
                topmostNode = parentNode;

                let checkedCount = 0;
                let indeterminate = false;

                const len = parentNode.children ? parentNode.children.length : 0;
                for (let i = 0; i < len; ++i) {
                    const childNode = parentNode.children[i];
                    indeterminate = indeterminate || (!!childNode.state.indeterminate);
                    if (childNode.state.checked) {
                        checkedCount++;
                    }
                }

                if (checkedCount === 0) {
                    parentNode.state.indeterminate = false;
                    parentNode.state.checked = false;
                } else if ((checkedCount > 0 && checkedCount < len) || indeterminate) {
                    parentNode.state.indeterminate = true;
                    parentNode.state.checked = true;
                } else {
                    parentNode.state.indeterminate = false;
                    parentNode.state.checked = true;
                }

                parentNode = parentNode.parent;
            }
        };

        updateChildNodes(node);
        updateParentNodes(node);

        this.updateNode(topmostNode);

        // Emit a "checkNode" event
        this.emit('checkNode', node);

        return true;
    }
    // Clears the tree.
    clear() {
        if (this.clusterize) {
            this.clusterize.clear();
        }
        this.nodeTable.clear();
        this.nodes = [];
        this.rows = [];
        this.state.openNodes = [];
        this.state.rootNode = createRootNode(this.state.rootNode);
        this.state.selectedNode = null;
    }
    // Closes a node to hide its children.
    // @param {Node} node The Node object.
    // @param {object} [options] The options object.
    // @param {boolean} [options.silent] Pass true to prevent "closeNode" and "selectNode" events from being triggered.
    // @return {boolean} Returns true on success, false otherwise.
    closeNode(node, options) {
        const {
            async = false,
            asyncCallback = noop,
            silent = false
        } = { ...options };

        if (!ensureNodeInstance(node)) {
            return false;
        }

        this.emit('willCloseNode', node);

        // Cannot close the root node
        if (node === this.state.rootNode) {
            error('Cannot close the root node');
            return false;
        }

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            error('Invalid node index');
            return false;
        }

        // Check if the closeNode action can be performed
        if (this.state.openNodes.indexOf(node) < 0) {
            return false;
        }

        // Toggle the collapsing state
        node.state.collapsing = true;
        // Update the row corresponding to the node
        this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);
        // Update list
        this.update();

        const fn = () => {
            // Keep selected node unchanged if "node" is equal to "this.state.selectedNode"
            if (this.state.selectedNode && (this.state.selectedNode !== node)) {
                // row #0 - node.0         => parent node (total=4)
                // row #1   - node.0.0     => close this node; next selected node (total=2)
                // row #2       node.0.0.0 => selected node (total=0)
                // row #3       node.0.0.1
                // row #4     node.0.1
                const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
                const total = node.state.total;
                const rangeFrom = nodeIndex + 1;
                const rangeTo = nodeIndex + total;

                if ((rangeFrom <= selectedIndex) && (selectedIndex <= rangeTo)) {
                    this.selectNode(node, options);
                }
            }

            node.state.open = false; // Set the open state to false
            const openNodes = this.state.openNodes.filter((node) => node.state.open);
            this.state.openNodes = openNodes;

            // Subtract total from ancestor nodes
            const total = node.state.total;
            for (let p = node; p !== null; p = p.parent) {
                p.state.total = p.state.total - total;
            }

            // Update nodes & rows
            this.nodes.splice(nodeIndex + 1, total);
            this.rows.splice(nodeIndex + 1, total);

            // Toggle the collapsing state
            node.state.collapsing = false;
            // Update the row corresponding to the node
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

            // Update list
            this.update();

            if (!silent) {
                // Emit a "closeNode" event
                this.emit('closeNode', node);
            }

            if (typeof asyncCallback === 'function') {
                asyncCallback();
            }
        };

        if (async) {
            setTimeout(fn, 0);
        } else {
            fn();
        }

        return true;
    }
    // Filters nodes. Use a string or a function to test each node of the tree. Otherwise, it will render nothing after filtering (e.g. tree.filter(), tree.filter(null), tree.flter(0), tree.filter({}), etc.).
    // @param {string|function} predicate A keyword string, or a function to test each node of the tree. If the predicate is an empty string, all nodes will be filtered. If the predicate is a function, returns true to keep the node, false otherwise.
    // @param {object} [options] The options object.
    // @param {boolean} [options.caseSensitive] Case sensitive string comparison. Defaults to false. This option is only available for string comparison.
    // @param {boolean} [options.exactMatch] Exact string matching. Defaults to false. This option is only available for string comparison.
    // @param {string} [options.filterPath] Gets the value at path of Node object. Defaults to 'name'. This option is only available for string comparison.
    // @param {boolean} [options.includeAncestors] Whether to include ancestor nodes. Defaults to true.
    // @param {boolean} [options.includeDescendants] Whether to include descendant nodes. Defaults to true.
    // @example
    //
    // const filterOptions = {
    //     caseSensitive: false,
    //     exactMatch: false,
    //     filterPath: 'props.some.other.key',
    //     includeAncestors: true,
    //     includeDescendants: true
    // };
    // tree.filter('keyword', filterOptions);
    //
    // @example
    //
    // const filterOptions = {
    //     includeAncestors: true,
    //     includeDescendants: true
    // };
    // tree.filter(function(node) {
    //     const keyword = 'keyword';
    //     const filterText = node.name || '';
    //     return filterText.toLowerCase().indexOf(keyword) >= 0;
    // }, filterOptions);
    filter(predicate, options) {
        options = {
            caseSensitive: false,
            exactMatch: false,
            filterPath: 'name',
            includeAncestors: true,
            includeDescendants: true,
            ...options
        };

        this.filtered = true;

        const rootNode = this.state.rootNode;
        const traverse = (node, filterNode = false) => {
            if (!node || !node.children) {
                return false;
            }

            if (node === rootNode) {
                node.state.filtered = false;
            } else if (filterNode) {
                node.state.filtered = true;
            } else if (typeof predicate === 'string') {
                // string
                let filterText = get(node, options.filterPath, '');
                if (Number.isFinite(filterText)) {
                    filterText = String(filterText);
                }
                if (typeof filterText !== 'string') {
                    filterText = '';
                }
                let keyword = predicate;
                if (!options.caseSensitive) {
                    filterText = filterText.toLowerCase();
                    keyword = keyword.toLowerCase();
                }
                node.state.filtered = options.exactMatch
                    ? (filterText === keyword)
                    : (filterText.indexOf(keyword) >= 0);
            } else if (typeof predicate === 'function') {
                // function
                const callback = predicate;
                node.state.filtered = !!callback(node);
            } else {
                node.state.filtered = false;
            }

            if (options.includeDescendants) {
                filterNode = filterNode || node.state.filtered;
            }

            let filtered = false;
            for (let i = 0; i < node.children.length; ++i) {
                const childNode = node.children[i];
                if (!childNode) {
                    continue;
                }
                if (traverse(childNode, filterNode)) {
                    filtered = true;
                }
            }
            if (options.includeAncestors && filtered) {
                node.state.filtered = true;
            }

            return node.state.filtered;
        };

        traverse(rootNode);

        // Update rows
        this.rows.length = this.nodes.length;
        for (let i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            this.rows[i] = this.options.rowRenderer(node, this.options);
        }

        this.update();
    }
    // Flattens all child nodes of a parent node by performing full tree traversal using child-parent link.
    // No recursion or stack is involved.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @return {array} Returns an array of Node objects containing all the child nodes of the parent node.
    flattenChildNodes(parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;

        if (!ensureNodeInstance(parentNode)) {
            return [];
        }

        let list = [];
        let node = parentNode.getFirstChild(); // Ignore parent node
        while (node) {
            list.push(node);
            if (node.hasChildren()) {
                node = node.getFirstChild();
            } else {
                // Find the parent level
                while ((node.getNextSibling() === null) && (node.parent !== parentNode)) {
                    // Use child-parent link to get to the parent level
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
        if (!ensureNodeInstance(node)) {
            return [];
        }

        return [node].concat(this.flattenChildNodes(node));
    }
    // Gets a list of child nodes.
    // @param {Node} [parentNode] The Node object that defines the parent node. If null or undefined, returns a list of top level nodes.
    // @return {array} Returns an array of Node objects containing all the child nodes of the parent node.
    getChildNodes(parentNode) {
        // Defaults to rootNode if the parentNode is not specified
        parentNode = parentNode || this.state.rootNode;

        if (!ensureNodeInstance(parentNode)) {
            return [];
        }

        return parentNode.children;
    }
    // Gets a node by its unique id. This assumes that you have given the nodes in the data a unique id.
    // @param {string|number} id An unique node id. A null value will be returned if the id doesn't match.
    // @return {Node} Returns a node the matches the id, null otherwise.
    getNodeById(id) {
        let node = this.nodeTable.get(id);
        if (!node) {
            // Find the first node that matches the id
            node = this.nodes.filter(node => node.id === id)[0];
            if (!node) {
                return null;
            }
            this.nodeTable.set(node.id, node);
        }
        return node;
    }
    // Returns the node at the specified point. If the specified point is outside the visible bounds or either coordinate is negative, the result is null.
    // @param {number} x A horizontal position within the current viewport.
    // @param {number} y A vertical position within the current viewport.
    // @return {Node} The Node object under the given point.
    getNodeFromPoint(x, y) {
        let el = document.elementFromPoint(x, y);
        while (el && el.parentElement !== this.contentElement) {
            el = el.parentElement;
        }
        if (!el) {
            return null;
        }
        const id = el.getAttribute(this.options.nodeIdAttr);
        const node = this.getNodeById(id);

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
    // Gets the index of the selected node.
    // @return {number} Returns the index of the selected node, or -1 if not selected.
    getSelectedIndex() {
        return this.nodes.indexOf(this.state.selectedNode);
    }
    // Inserts the specified node after the reference node.
    // @param {object} newNode The new sibling node.
    // @param {Node} referenceNode The Node object that defines the reference node.
    // @return {boolean} Returns true on success, false otherwise.
    insertNodeAfter(newNode, referenceNode) {
        if (!ensureNodeInstance(referenceNode)) {
            return false;
        }

        const parentNode = referenceNode.getParent();
        const index = parentNode.children.indexOf(referenceNode) + 1;
        const newNodes = [].concat(newNode || []); // Ensure array

        return this.addChildNodes(newNodes, index, parentNode);
    }
    // Inserts the specified node before the reference node.
    // @param {object} newNode The new sibling node.
    // @param {Node} referenceNode The Node object that defines the reference node.
    // @return {boolean} Returns true on success, false otherwise.
    insertNodeBefore(newNode, referenceNode) {
        if (!ensureNodeInstance(referenceNode)) {
            return false;
        }

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

        this.state.openNodes = this.nodes.filter((node) => node.state.open);
        this.state.selectedNode = null;

        const rootNode = ((node = null) => {
            // Finding the root node
            while (node && node.parent !== null) {
                node = node.parent;
            }
            return node;
        })((this.nodes.length > 0) ? this.nodes[0] : null);

        this.state.rootNode = rootNode || createRootNode(this.state.rootNode); // Create a new root node if rootNode is null

        // Update the lookup table with newly added nodes
        this.flattenChildNodes(this.state.rootNode).forEach((node) => {
            if (node.id !== undefined) {
                this.nodeTable.set(node.id, node);
            }
        });

        // Update rows
        this.rows.length = this.nodes.length;
        for (let i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            this.rows[i] = this.options.rowRenderer(node, this.options);
        }

        // Update list
        this.update();
    }
    // Moves a node from its current position to the new position.
    // @param {Node} node The Node object.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @param {number} [index] The 0-based index of where to insert the child node.
    // @return {boolean} Returns true on success, false otherwise.
    moveNodeTo(node, parentNode, index) {
        if (!ensureNodeInstance(node) || !ensureNodeInstance(parentNode)) {
            return false;
        }

        for (let p = parentNode; p !== null; p = p.parent) {
            if (p === node) {
                error(`Cannot move an ancestor node (id=${node.id}) to the specified parent node (id=${parentNode.id}).`);
                return false;
            }
        }

        return this.removeNode(node) && this.addChildNodes(node, index, parentNode);
    }
    // Opens a node to display its children.
    // @param {Node} node The Node object.
    // @param {object} [options] The options object.
    // @param {boolean} [options.silent] Pass true to prevent "openNode" event from being triggered.
    // @return {boolean} Returns true on success, false otherwise.
    openNode(node, options) {
        const {
            async = false,
            asyncCallback = noop,
            silent = false
        } = { ...options };

        if (!ensureNodeInstance(node)) {
            return false;
        }

        if (!this.nodeTable.has(node.id)) {
            error('Cannot open node with the given node id:', node.id);
            return false;
        }

        // Check if the openNode action can be performed
        if (this.state.openNodes.indexOf(node) >= 0) {
            return false;
        }

        this.emit('willOpenNode', node);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);

        const fn = () => {
            node.state.open = true;

            if (this.state.openNodes.indexOf(node) < 0) {
                // the most recently used items first
                this.state.openNodes = [node].concat(this.state.openNodes);
            }

            const nodes = flatten(node.children, { openNodes: this.state.openNodes });

            // Add all child nodes to the lookup table if the first child does not exist in the lookup table
            if ((nodes.length > 0) && !(this.nodeTable.get(nodes[0]))) {
                nodes.forEach((node) => {
                    if (node.id !== undefined) {
                        this.nodeTable.set(node.id, node);
                    }
                });
            }

            // Toggle the expanding state
            node.state.expanding = false;

            if (nodeIndex >= 0) {
                const rows = [];
                // Update rows
                rows.length = nodes.length;
                for (let i = 0; i < nodes.length; ++i) {
                    const node = nodes[i];
                    rows[i] = this.options.rowRenderer(node, this.options);
                }

                // Update nodes & rows
                this.nodes.splice.apply(this.nodes, [nodeIndex + 1, 0].concat(nodes));
                this.rows.splice.apply(this.rows, [nodeIndex + 1, 0].concat(rows));

                // Update the row corresponding to the node
                this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

                // Update list
                this.update();
            }

            if (!silent) {
                // Emit a "openNode" event
                this.emit('openNode', node);
            }

            if (typeof asyncCallback === 'function') {
                asyncCallback();
            }
        };

        if (nodeIndex < 0) {
            // Toggle the expanding state
            node.state.expanding = true;

            if (async) {
                setTimeout(fn, 0);
            } else {
                fn();
            }

            return true;
        }

        const shouldLoadNodes = (typeof this.options.shouldLoadNodes === 'function')
            ? !!(this.options.shouldLoadNodes(node))
            : !node.hasChildren() && node.loadOnDemand;

        if (shouldLoadNodes) {
            if (typeof this.options.loadNodes !== 'function') {
                return false;
            }

            // Reentrancy not allowed
            if (node.state.loading === true) {
                return false;
            }

            // Toggle the loading state
            node.state.loading = true;
            // Update the row corresponding to the node
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);
            // Update list
            this.update();

            // Do a setTimeout to prevent the CPU intensive task
            setTimeout(() => {
                this.options.loadNodes(node, (err, nodes, done = noop) => {
                    nodes = ensureArray(nodes);

                    const currentNodeIndex = this.nodes.indexOf(node);

                    if (nodes.length === 0 && currentNodeIndex >= 0) {
                        node.state.open = true;

                        if (this.state.openNodes.indexOf(node) < 0) {
                            // the most recently used items first
                            this.state.openNodes = [node].concat(this.state.openNodes);
                        }
                    }

                    if (err || nodes.length === 0) {
                        // Toggle the loading state
                        node.state.loading = false;
                        // Update the row corresponding to the node
                        this.rows[currentNodeIndex] = this.options.rowRenderer(node, this.options);
                        // Update list
                        this.update();

                        if (typeof done === 'function') {
                            done();
                        }
                        return;
                    }

                    this.addChildNodes(nodes, node);

                    // Ensure the node has children to prevent infinite loop
                    if (node.hasChildren()) {
                        // Call openNode again
                        this.openNode(node, {
                            ...options,
                            async: true,
                            asyncCallback: () => {
                                // Toggle the loading state
                                node.state.loading = false;
                                const openedNodeIndex = this.nodes.indexOf(node);
                                // Update the row corresponding to the node
                                this.rows[openedNodeIndex] = this.options.rowRenderer(node, this.options);
                                // Update list
                                this.update();

                                if (typeof done === 'function') {
                                    done();
                                }
                            }
                        });
                    } else {
                        // Toggle the loading state
                        node.state.loading = false;
                        // Update the row corresponding to the node
                        this.rows[currentNodeIndex] = this.options.rowRenderer(node, this.options);
                        // Update list
                        this.update();

                        if (typeof done === 'function') {
                            done();
                        }
                    }
                });
            }, 0);

            return true;
        }

        // Toggle the expanding state
        node.state.expanding = true;

        // Update the row corresponding to the node
        this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);
        // Update list
        this.update();

        if (async) {
            setTimeout(fn, 0);
        } else {
            fn();
        }

        return true;
    }
    // Removes all child nodes from a parent node.
    // @param {Node} parentNode The Node object that defines the parent node.
    // @param {object} [options] The options object.
    // @param {boolean} [options.silent] Pass true to prevent "selectNode" event from being triggered.
    // @return {boolean} Returns true on success, false otherwise.
    removeChildNodes(parentNode, options) {
        if (!ensureNodeInstance(parentNode)) {
            return false;
        }

        if (parentNode.children.length === 0) {
            return false;
        }
        if (parentNode === this.state.rootNode) {
            this.clear();
            return true;
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
                if (parentNode === this.state.rootNode) {
                    this.selectNode(null, options);
                } else {
                    this.selectNode(parentNode, options);
                }
            }
        }

        // Get the nodes being removed
        const removedNodes = this.flattenChildNodes(parentNode);

        // Get the number of nodes to be removed
        const deleteCount = parentNode.state.total;

        // Subtract the deleteCount for all ancestors (parent, grandparent, etc.) of the current node
        for (let p = parentNode; p !== null; p = p.parent) {
            p.state.total = p.state.total - deleteCount;
        }

        // Update parent node
        parentNode.children = [];
        if (parentNode !== this.state.rootNode) {
            parentNode.state.open = parentNode.state.open && (parentNode.children.length > 0);
        }

        if (parentNodeIndex >= 0) {
            // Update nodes & rows
            this.nodes.splice(parentNodeIndex + 1, deleteCount);
            this.rows.splice(parentNodeIndex + 1, deleteCount);

            // Update the row corresponding to the parent node
            this.rows[parentNodeIndex] = this.options.rowRenderer(parentNode, this.options);
        }

        { // Update open nodes and lookup table
            this.state.openNodes = this.state.openNodes.filter((node) => {
                return (removedNodes.indexOf(node) < 0) && node.state.open;
            });

            removedNodes.forEach((node) => {
                this.nodeTable.unset(node.id);
            });
        }

        // Update list
        this.update();

        return true;
    }
    // Removes a node and all of its child nodes.
    // @param {Node} node The Node object.
    // @param {object} [options] The options object.
    // @param {boolean} [options.silent] Pass true to prevent "selectNode" event from being triggered.
    // @return {boolean} Returns true on success, false otherwise.
    removeNode(node, options) {
        if (!ensureNodeInstance(node)) {
            return false;
        }

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

                if (selectedNode === this.state.rootNode) {
                    this.selectNode(null, options);
                } else {
                    this.selectNode(selectedNode, options);
                }
            }
        }

        // Get the nodes being removed
        const removedNodes = this.flattenNode(node);

        // Get the number of nodes to be removed
        const deleteCount = node.state.total + 1;

        // Subtract the deleteCount for all ancestors (parent, grandparent, etc.) of the current node
        for (let p = parentNode; p !== null; p = p.parent) {
            p.state.total = p.state.total - deleteCount;
        }

        // Update parent node
        parentNode.children.splice(parentNode.children.indexOf(node), 1);
        if (parentNode !== this.state.rootNode) {
            parentNode.state.open = parentNode.state.open && (parentNode.children.length > 0);
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
            this.state.openNodes = this.state.openNodes.filter((node) => {
                return (removedNodes.indexOf(node) < 0) && node.state.open;
            });

            removedNodes.forEach((node) => {
                this.nodeTable.unset(node.id);
            });
        }

        // Update list
        this.update();

        return true;
    }
    // Sets the current scroll position to this node.
    // @param {Node} node The Node object.
    // @return {boolean} Returns true on success, false otherwise.
    scrollToNode(node) {
        if (!ensureNodeInstance(node)) {
            return false;
        }

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            return false;
        }
        if (!this.contentElement) {
            return false;
        }

        // Scroll to a desired position
        let firstChild = this.contentElement.firstChild;
        while (firstChild) {
            const className = firstChild.className || '';
            if (className.indexOf('clusterize-extra-row') < 0 && (firstChild.offsetHeight > 0)) {
                break;
            }
            firstChild = firstChild.nextSibling;
        }
        // If all items in the list is the same height, it can be calculated by nodeIndex * height.
        const offsetHeight = (firstChild && firstChild.offsetHeight) || 0;
        if (offsetHeight > 0) {
            this.scrollTop(nodeIndex * offsetHeight);
        }

        // Find the absolute position of the node
        const nodeSelector = `[${this.options.nodeIdAttr}="${node.id}"]`;
        const nodeEl = this.contentElement.querySelector(nodeSelector);
        if (nodeEl) {
            this.scrollTop(nodeEl.offsetTop);
        }

        return true;
    }
    // Gets (or sets) the current vertical position of the scroll bar.
    // @param {number} [value] If the value is specified, indicates the new position to set the scroll bar to.
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
    // @param {object} [options] The options object.
    // @param {boolean} [options.autoScroll] Pass true to automatically scroll to the selected node. Defaults to true.
    // @param {boolean} [options.silent] Pass true to prevent "selectNode" event from being triggered. Defaults to false.
    // @return {boolean} Returns true on success, false otherwise.
    selectNode(node = null, options) {
        const { selectable, shouldSelectNode } = this.options;
        const { autoScroll = true, silent = false } = { ...options };

        this.emit('willSelectNode', node);

        if (!selectable) {
            return false;
        }
        if ((typeof shouldSelectNode === 'function') && !shouldSelectNode(node)) {
            return false;
        }
        if (node === this.state.rootNode) {
            return false;
        }

        if (node === null) {
            // Deselect the current node
            if (this.state.selectedNode) {
                const selectedNode = this.state.selectedNode;
                const selectedIndex = this.nodes.indexOf(this.state.selectedNode);

                selectedNode.state.selected = false;
                this.rows[selectedIndex] = this.options.rowRenderer(selectedNode, this.options);
                this.state.selectedNode = null;

                // Update list
                this.update();

                if (!silent) {
                    // Emit a "selectNode" event
                    this.emit('selectNode', null);
                }

                return true;
            }

            return false;
        }

        if (!ensureNodeInstance(node)) {
            return false;
        }

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex < 0) {
            return false;
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
            const selectedIndex = this.nodes.indexOf(this.state.selectedNode);
            selectedNode.state.selected = false;
            this.rows[selectedIndex] = this.options.rowRenderer(selectedNode, this.options);
        }

        if (this.state.selectedNode !== node) {
            this.state.selectedNode = node;

            if (!silent) {
                // Emit a "selectNode" event
                this.emit('selectNode', node);
            }

            if (autoScroll && this.scrollElement && this.contentElement) {
                const nodeSelector = `[${this.options.nodeIdAttr}="${node.id}"]`;
                const nodeEl = this.contentElement.querySelector(nodeSelector);
                if (nodeEl) {
                    const offsetTop = nodeEl.offsetTop || 0;
                    const offsetHeight = nodeEl.offsetHeight || 0;

                    // Scroll Up
                    if (offsetTop < this.scrollElement.scrollTop) {
                        this.scrollElement.scrollTop = offsetTop;
                    }

                    // Scroll Down
                    if (offsetTop + offsetHeight >= this.scrollElement.scrollTop + this.scrollElement.clientHeight) {
                        this.scrollElement.scrollTop += offsetHeight;
                    }
                }
            }
        } else {
            this.state.selectedNode = null;

            if (!silent) {
                // Emit a "selectNode" event
                this.emit('selectNode', null);
            }
        }

        // Update list
        this.update();

        return true;
    }
    // Swaps two nodes.
    // @param {Node} node1 The Node object.
    // @param {Node} node2 The Node object.
    // @return {boolean} Returns true on success, false otherwise.
    swapNodes(node1, node2) {
        if (!ensureNodeInstance(node1) || !ensureNodeInstance(node1.parent)) {
            return false;
        }
        if (!ensureNodeInstance(node2) || !ensureNodeInstance(node2.parent)) {
            return false;
        }

        const parentNode1 = node1.parent;
        const parentNode2 = node2.parent;

        for (let p = parentNode1; p !== null; p = p.parent) {
            if (p === node2) {
                error('Cannot swap two nodes with one being an ancestor of the other.');
                return false;
            }
        }
        for (let p = parentNode2; p !== null; p = p.parent) {
            if (p === node1) {
                error('Cannot swap two nodes with one being an ancestor of the other.');
                return false;
            }
        }

        const nodeIndex1 = parentNode1.children.indexOf(node1);
        const nodeIndex2 = parentNode2.children.indexOf(node2);

        return this.moveNodeTo(node1, parentNode2, nodeIndex2) && this.moveNodeTo(node2, parentNode1, nodeIndex1);
    }
    // Toggles a node to display or hide its children.
    // @param {Node} node The Node object.
    // @param {object} [options] The options object.
    // @param {boolean} [options.silent] Pass true to prevent "closeNode", "openNode", and "selectNode" events from being triggered.
    // @return {boolean} Returns true on success, false otherwise.
    toggleNode(node, options) {
        if (!ensureNodeInstance(node)) {
            return false;
        }

        if (this.state.openNodes.indexOf(node) >= 0) {
            // Close node
            return this.closeNode(node, options);
        } else {
            // Open node
            return this.openNode(node, options);
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
    // Unfilters nodes.
    unfilter() {
        this.filtered = false;

        const rootNode = this.state.rootNode;
        const traverse = (node) => {
            if (!node) {
                return;
            }
            delete node.state.filtered;

            if (!node.children) {
                return;
            }
            for (let i = 0; i < node.children.length; ++i) {
                const childNode = node.children[i];
                if (!childNode) {
                    continue;
                }
                traverse(childNode);
            }
        };

        traverse(rootNode);

        // Update rows
        this.rows.length = this.nodes.length;
        for (let i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            this.rows[i] = this.options.rowRenderer(node, this.options);
        }

        this.update();
    }
    // Updates the tree.
    update() {
        // Emit a "contentWillUpdate" event
        this.emit('contentWillUpdate');

        if (this.clusterize) {
            // Update list
            const rows = this.rows.filter(row => !!row);
            this.clusterize.update(rows);
        }

        // Emit a "contentWillUpdate" event
        this.emit('contentDidUpdate');
    }
    // Updates the data of a node.
    // @param {Node} node The Node object.
    // @param {object} data The data object.
    // @param {object} [options] The options object.
    // @param {boolean} [options.shallowRendering] True to render only the parent node, false to render the parent node and all expanded child nodes. Defaults to false.
    updateNode(node, data, options) {
        if (!ensureNodeInstance(node)) {
            return;
        }

        // Clone a new one
        data = { ...data };

        if (data.id !== undefined && data.id !== null) {
            this.nodeTable.unset(node.id);
            this.nodeTable.set(data.id, node);
            node.id = data.id;
        }

        // Ignore keys: id, children, parent, and state
        delete data.id;
        delete data.children;
        delete data.parent;
        delete data.state;

        node = extend(node, data);

        // Retrieve node index
        const nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex >= 0) {
            const { shallowRendering = false } = { ...options };

            // Update the row corresponding to the node
            this.rows[nodeIndex] = this.options.rowRenderer(node, this.options);

            if (!shallowRendering) {
                const total = node.state.total;
                const rangeFrom = nodeIndex + 1;
                const rangeTo = nodeIndex + total;
                for (let index = rangeFrom; index <= rangeTo; ++index) {
                    this.rows[index] = this.options.rowRenderer(this.nodes[index], this.options);
                }
            }

            // Update list
            this.update();
        }
    }
}

export default InfiniteTree;
