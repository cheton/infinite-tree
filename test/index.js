import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Node } from 'flattree';

const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console);

const dom = new JSDOM('', { virtualConsole });

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

const getTreeData = () => {
    const json = fs.readFileSync(path.resolve('test/fixtures/tree.json'), 'utf8');
    return Object.assign({}, JSON.parse(json));
};
const InfiniteTree = require('../src');

const getTreeElement = () => {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }

    const el = document.createElement('div');
    el.setAttribute('id', 'tree');
    document.body.appendChild(el);

    return el;
};

test('Stealth mode', (t) => {
    { // #1
        const tree = new InfiniteTree(null, {
            autoOpen: true,
            data: getTreeData()
        });

        t.equal(tree.clusterize, null);
        t.equal(tree.contentElement, null);
        t.equal(tree.scrollElement, null);
        t.equal(tree.draggableTarget, null);
        t.equal(tree.droppableTarget, null);

        t.equal(tree.nodes.length, 12);
        t.equal(tree.rows.length, 12);

        tree.destroy();

        t.equal(tree.clusterize, null);
        t.equal(tree.contentElement, null);
        t.equal(tree.scrollElement, null);
        t.equal(tree.draggableTarget, null);
        t.equal(tree.droppableTarget, null);

        t.equal(tree.nodes.length, 0);
        t.equal(tree.rows.length, 0);
    }

    { // #2
        const tree = new InfiniteTree({
            autoOpen: true,
            data: getTreeData()
        });

        t.equal(tree.clusterize, null);
        t.equal(tree.contentElement, null);
        t.equal(tree.scrollElement, null);
        t.equal(tree.draggableTarget, null);
        t.equal(tree.droppableTarget, null);

        t.equal(tree.nodes.length, 12);
        t.equal(tree.rows.length, 12);

        tree.destroy();

        t.equal(tree.clusterize, null);
        t.equal(tree.contentElement, null);
        t.equal(tree.scrollElement, null);
        t.equal(tree.draggableTarget, null);
        t.equal(tree.droppableTarget, null);

        t.equal(tree.nodes.length, 0);
        t.equal(tree.rows.length, 0);
    }

    t.end();
});

test('Close all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    t.strictSame(tree.nodes.length, 1);
    t.strictSame(tree.rows.length, 1);
    t.end();
});

test('Open all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    t.strictSame(tree.nodes.length, 12);
    t.strictSame(tree.rows.length, 12);
    t.end();
});

test('It should generate expected output for empty result', (t) => {
    const el = getTreeElement();
    const options = {
        noDataClass: 'my-no-data-class',
        noDataText: 'My no data text'
    };
    const tree = new InfiniteTree(el, options);
    const innerHTML = `<div id="tree"><div class="infinite-tree infinite-tree-scroll"><div class="infinite-tree infinite-tree-content" tabindex="0"><div class="${options.noDataClass}">${options.noDataText}</div></div></div></div>`;

    t.strictSame(window.document.body.innerHTML, innerHTML);
    t.strictSame(tree.nodes.length, 0);
    t.strictSame(tree.rows.length, 0);
    t.end();
});

test('loadOnDemand', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: {
            id: '<root>',
            loadOnDemand: true
        },
        loadNodes: (node, next) => {
            t.equal(tree.getNodeById('<root>').getChildren().length, 0);

            // Asynchronous
            setTimeout(() => {
                next(null, [], () => {
                    t.equal(tree.getNodeById('<root>').getChildren().length, 0);
                    t.equal(tree.state.openNodes.length, 1);
                    t.equal(node.state.open, true);
                    t.end();
                });
            }, 250);

            // Asynchronous
            setTimeout(() => {
                const data = getTreeData();
                next(null, data.children, () => {
                    t.equal(tree.getNodeById('<root>').getChildren().length, 2);
                    t.equal(tree.state.openNodes.length, 1);
                    t.end();
                });
            }, 500);
        }
    });

    t.ok(tree.openNode(tree.getNodeById('<root>')));
});

test('shouldLoadNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: {
            id: '<root>',
            loadNodes: true
        },
        shouldLoadNodes: (node) => {
            return !node.hasChildren() && node.loadNodes;
        },
        loadNodes: (node, next) => {
            t.equal(tree.getNodeById('<root>').getChildren().length, 0);

            // Asynchronous
            setTimeout(() => {
                next(null, [], () => {
                    t.equal(tree.getNodeById('<root>').getChildren().length, 0);
                    t.equal(tree.state.openNodes.length, 1);
                    t.equal(node.state.open, true);
                    t.end();
                });
            }, 250);

            // Asynchronous
            setTimeout(() => {
                const data = getTreeData();
                next(null, data.children, () => {
                    t.equal(tree.getNodeById('<root>').getChildren().length, 2);
                    t.equal(tree.state.openNodes.length, 1);
                    t.end();
                });
            }, 500);
        }
    });

    t.ok(tree.openNode(tree.getNodeById('<root>')));
});

test('tree.destroy', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    t.notEqual(tree.clusterize, null);
    t.notEqual(tree.contentElement, null);
    t.notEqual(tree.scrollElement, null);
    t.equal(tree.nodes.length, 12);
    t.equal(tree.rows.length, 12);

    tree.destroy();

    t.equal(tree.clusterize, null);
    t.equal(tree.contentElement, null);
    t.equal(tree.scrollElement, null);
    t.equal(tree.nodes.length, 0);
    t.equal(tree.rows.length, 0);

    t.end();
});

test('tree.addChildNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    const nodesLength = tree.nodes.length;

    { // #1: Add a child node to the root node without specifying index
        tree.addChildNodes({ id: 'new-node#1' });
        t.equal(tree.nodes.length, nodesLength + 1);
        t.notEqual(tree.getNodeById('new-node#1'), null);
        t.strictSame(tree.getNodeById('new-node#1').getPreviousSibling(), tree.getNodeById('<root>'));
        t.equal(tree.getNodeById('new-node#1').getNextSibling(), null);
    }

    { // #2: Add a child node to the root node at the specified index
        tree.addChildNodes({ id: 'new-node#2' }, 1);
        t.equal(tree.nodes.length, nodesLength + 2);
        t.notEqual(tree.getNodeById('new-node#2'), null);
        t.strictSame(tree.getNodeById('new-node#2').getPreviousSibling(), tree.getNodeById('<root>'));
        t.strictSame(tree.getNodeById('new-node#2').getNextSibling(), tree.getNodeById('new-node#1'));
    }

    t.end();
});

test('tree.appendChildNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    const nodesLength = tree.nodes.length;

    { // #1: Append a child node to the root node
        tree.appendChildNode({ id: 'new-node#1' });
        t.equal(tree.nodes.length, nodesLength + 1);
        t.notEqual(tree.getNodeById('new-node#1'), null);
        t.strictSame(tree.getNodeById('new-node#1').getPreviousSibling(), tree.getNodeById('<root>'));
        t.equal(tree.getNodeById('new-node#1').getNextSibling(), null);
    }

    t.end();
});

test('tree.clear', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    t.equal(tree.nodes.length, 12);
    tree.clear();
    t.equal(tree.nodes.length, 0);

    t.end();
});

test('tree.closeNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    let eventFiredCount = 0;

    tree.on('closeNode', (node) => {
        ++eventFiredCount;
    });

    // Close Node
    t.notOk(tree.closeNode());
    t.equal(tree.nodes.length, 12);
    tree.closeNode(tree.getNodeById('india'));
    t.equal(tree.nodes.length, 11);
    tree.closeNode(tree.getNodeById('delta'));
    t.equal(tree.nodes.length, 9);
    tree.closeNode(tree.getNodeById('hotel'));
    t.equal(tree.nodes.length, 8);
    tree.closeNode(tree.getNodeById('charlie'));
    t.equal(tree.nodes.length, 6);
    tree.closeNode(tree.getNodeById('bravo'));
    t.equal(tree.nodes.length, 3);
    tree.closeNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.equal(tree.nodes.length, 1);

    // Check event fired count
    t.equal(eventFiredCount, 5);

    t.end();
});

test('tree.filter', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    t.equal(tree.filtered, false);

    { // No predicate
        tree.filter();
        t.equal(tree.filtered, true);
        const nodes = tree.flattenChildNodes();
        t.equal(nodes.filter(node => node.state.filtered === true).length, 0);
        t.equal(nodes.filter(node => node.state.filtered === false).length, 12);
        t.equal(tree.rows.filter(row => !!row).length, 0);
    }

    { // Invalid predicate: Object
        tree.filter({});
        t.equal(tree.filtered, true);
        const nodes = tree.flattenChildNodes();
        t.equal(nodes.filter(node => node.state.filtered === true).length, 0);
        t.equal(nodes.filter(node => node.state.filtered === false).length, 12);
        t.equal(tree.rows.filter(row => !!row).length, 0);
    }

    { // Invalid predicate: Number
        tree.filter(0);
        t.equal(tree.filtered, true);
        const nodes = tree.flattenChildNodes();
        t.equal(nodes.filter(node => node.state.filtered === true).length, 0);
        t.equal(nodes.filter(node => node.state.filtered === false).length, 12);
        t.equal(tree.rows.filter(row => !!row).length, 0);
    }

    { // Empty keyword
        tree.filter('');
        t.equal(tree.filtered, true);
        const nodes = tree.flattenChildNodes();
        t.equal(nodes.filter(node => node.state.filtered === true).length, 12);
        t.equal(nodes.filter(node => node.state.filtered === false).length, 0);
        t.equal(tree.rows.filter(row => !!row).length, 12);
    }

    { // Not matched
        tree.filter('none');
        t.equal(tree.filtered, true);
        const nodes = tree.flattenChildNodes();
        t.equal(nodes.filter(node => node.state.filtered === true).length, 0);
        t.equal(nodes.filter(node => node.state.filtered === false).length, 12);
        t.equal(tree.rows.filter(row => !!row).length, 0);
    }

    const testCases = [
        { // Empty predicate
            predicate: null,
            options: {
                caseSensitive: false,
                exactMatch: false,
                includeAncestors: true,
                includeDescendants: true
            },
            wanted: []
        },
        { // Invalid filterPath
            predicate: 'charlie',
            options: {
                filterPath: 'children'
            },
            wanted: []
        },
        { // Invalid filterPath
            predicate: 'charlie',
            options: {
                filterPath: 'state.open'
            },
            wanted: []
        },
        { // Case sensitive
            predicate: 'charlie',
            options: {
                caseSensitive: true,
                exactMatch: false,
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: []
        },
        { // Case sensitive
            predicate: 'Charlie',
            options: {
                caseSensitive: true,
                exactMatch: false,
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: ['Charlie']
        },
        { // Exact match
            predicate: 'Charlie ',
            options: {
                caseSensitive: true,
                exactMatch: true,
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: []
        },
        { // Exact match
            predicate: 'Charlie',
            options: {
                caseSensitive: true,
                exactMatch: true,
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: ['Charlie']
        },
        { // Include ancestors
            predicate: 'charlie',
            options: {
                caseSensitive: false,
                exactMatch: false,
                includeAncestors: true,
                includeDescendants: false
            },
            wanted: ['<root>', 'Bravo', 'Charlie']
        },
        { // Include descendants
            predicate: 'charlie',
            options: {
                caseSensitive: false,
                exactMatch: false,
                includeAncestors: false,
                includeDescendants: true
            },
            wanted: ['Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']
        },
        { // Include ancestors and descendants
            predicate: 'charlie',
            options: {
                caseSensitive: false,
                exactMatch: false,
                includeAncestors: true,
                includeDescendants: true
            },
            wanted: ['<root>', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']
        },
        { // No ancestors and descendants
            predicate: 'charlie',
            options: {
                caseSensitive: false,
                exactMatch: false,
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: ['Charlie']
        },
        { // Function
            predicate: function(node) {
                return node.label === 'Charlie';
            },
            options: {
                includeAncestors: false,
                includeDescendants: false
            },
            wanted: ['Charlie']
        },
        { // Function
            predicate: function(node) {
                return node.label === 'Charlie';
            },
            options: {
                includeAncestors: true,
                includeDescendants: false
            },
            wanted: ['<root>', 'Bravo', 'Charlie']
        },
        { // Function
            predicate: function(node) {
                return node.label === 'Charlie';
            },
            options: {
                includeAncestors: false,
                includeDescendants: true
            },
            wanted: ['Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']
        },
        { // Function
            predicate: function(node) {
                return node.label === 'Charlie';
            },
            options: {
                includeAncestors: true,
                includeDescendants: true
            },
            wanted: ['<root>', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']
        }
    ];

    for (let i = 0; i < testCases.length; ++i) {
        const testCase = testCases[i];
        const { predicate, options } = testCase;
        if (typeof predicate === 'string') {
            options.filterPath = options.filterPath || 'label';
        }
        tree.filter(predicate, options);
        const found = tree.flattenChildNodes()
            .filter(node => node.state.filtered)
            .map(node => node.label);
        t.strictSame(found, testCase.wanted);
    }

    t.end();
});

test('tree.flattenChildNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    { // #1: Flatten an non-Node object
        const nodes = tree.flattenChildNodes({});
        t.equal(nodes.length, 0);
    }

    { // #2: Flatten all nodes within the tree
        const nodes = tree.flattenChildNodes();
        const wanted = tree.nodes;
        t.strictSame(nodes, wanted);
    }

    { // #3: Flatten all child nodes of a node
        const node = tree.getNodeById('<root>');
        const nodes = tree.flattenChildNodes(node);
        const wanted = tree.nodes.slice(tree.nodes.indexOf(node) + 1);
        t.strictSame(nodes, wanted);
    }

    t.end();
});

test('tree.flattenNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    { // #1: Pass null as a parameter
        const nodes = tree.flattenNode(null);
        const wanted = [];
        t.strictSame(nodes, wanted);
    }

    { // #2: Pass empty parameters
        const nodes = tree.flattenNode();
        const wanted = [];
        t.strictSame(nodes, wanted);
    }

    { // #3: Flatten a node
        const node = tree.getNodeById('bravo');
        const nodes = tree.flattenNode(node);
        const wanted = tree.nodes.slice(tree.nodes.indexOf(node) + 0);
        t.strictSame(nodes, wanted);
    }

    t.end();
});

test('tree.getChildNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    { // #1: Flatten an non-Node object
        const nodes = tree.getChildNodes({});
        t.equal(nodes.length, 0);
    }

    { // #2: Get child nodes of the root node
        const nodes = tree.getChildNodes().map((node) => {
            return {
                id: node.id,
                label: node.label,
                children: node.children,
                state: node.state
            };
        });
        const wanted = [
            tree.getNodeById('<root>')
        ].map((node) => {
            return {
                id: node.id,
                label: node.label,
                children: node.children,
                state: node.state
            };
        });
        t.strictSame(nodes, wanted);
    }

    { // #3: Get child nodes of a node
        const node = tree.getNodeById('bravo');
        const nodes = tree.getChildNodes(node).map((node) => {
            return {
                id: node.id,
                label: node.label,
                children: node.children,
                state: node.state
            };
        });
        const wanted = [
            tree.getNodeById('charlie'),
            tree.getNodeById('hotel'),
            tree.getNodeById('kilo')
        ].map((node) => {
            return {
                id: node.id,
                label: node.label,
                children: node.children,
                state: node.state
            };
        });
        t.strictSame(nodes, wanted);
    }

    t.end();
});

test('tree.getNodeById', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    t.notEqual(tree.getNodeById('<root>').id, null);
    t.equal(tree.getNodeById('none'), null);

    // Make sure it will rebuild the nodeTable if a node does not exist
    tree.nodeTable.clear();
    t.equal(tree.nodeTable.get('<root>'), undefined);
    t.notEqual(tree.getNodeById('<root>'), null);
    t.strictSame(tree.nodeTable.get('<root>'), tree.getNodeById('<root>'));

    t.end();
});

test('tree.getNodeFromPoint', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    //t.notOk(tree.getNodeFromPoint(0, 0));

    t.end();
});

test('tree.getOpenNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    })

    const found = tree.getOpenNodes().map(node => node.id);
    const wanted = ['<root>', 'bravo', 'charlie', 'delta', 'hotel', 'india'];
    t.strictSame(found, wanted);

    t.end();
});

test('tree.getRootNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    const node = tree.getRootNode();
    const found = {
        id: node.id,
        parent: node.parent,
        state: node.state
    };
    const wanted = {
        id: null,
        parent: null,
        state: {
            depth: -1,
            open: true,
            path: '',
            prefixMask: '',
            total: 1
        }
    };
    t.strictSame(found, wanted);

    t.end();
});

test('tree.getSelectedNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    const node = tree.getNodeById('<root>');
    t.ok(tree.selectNode(node));
    t.strictSame(tree.getSelectedNode(), node);

    t.end();
});

test('tree.insertNodeAfter', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    const notNode = {};
    tree.insertNodeAfter({ id: 'new-node' }, notNode);
    t.equal(tree.getNodeById('new-node'), null);

    tree.insertNodeAfter({ id: 'new-node' }, tree.getNodeById('<root>'));
    t.strictSame(tree.getNodeById('new-node'), tree.getNodeById('<root>').getNextSibling());

    t.end();
});

test('tree.insertNodeBefore', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        data: getTreeData()
    });

    const notNode = {};
    tree.insertNodeBefore({ id: 'new-node' }, notNode);
    t.equal(tree.getNodeById('new-node'), null);

    tree.insertNodeBefore({ id: 'new-node' }, tree.getNodeById('<root>'));
    t.strictSame(tree.getNodeById('new-node'), tree.getNodeById('<root>').getPreviousSibling());

    t.end();
});

test('tree.openNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    let eventFiredCount = 0;

    tree.on('openNode', (node) => {
        ++eventFiredCount;
    });

    // Not a Node object
    t.notOk(tree.openNode());

    // Not an existing Node object
    t.notOk(tree.openNode(new Node()));

    // The first node is `Node { id: "<root>" }`
    t.strictSame(tree.nodes[0], tree.getNodeById('<root>'));

    // Should be no open nodes at initial
    t.equal(tree.state.openNodes.length, 0);

    // Pass `{ silent: true }` to prevent event from being triggered
    t.ok(tree.openNode(tree.getNodeById('<root>'), { silent: true }));
    t.equal(tree.nodes.length, 3);
    t.equal(tree.state.openNodes.length, 1);

    t.equal(tree.openNode(tree.getNodeById('<root>')), false, 'it should return false when trying to re-open a node');

    t.ok(tree.openNode(tree.getNodeById('bravo')));
    t.equal(tree.nodes.length, 6);
    t.equal(tree.state.openNodes.length, 2);

    t.ok(tree.openNode(tree.getNodeById('charlie')));
    t.equal(tree.nodes.length, 8);
    t.equal(tree.state.openNodes.length, 3);

    t.ok(tree.openNode(tree.getNodeById('hotel')));
    t.equal(tree.nodes.length, 9);
    t.equal(tree.state.openNodes.length, 4);

    t.ok(tree.openNode(tree.getNodeById('delta')));
    t.equal(tree.nodes.length, 11);
    t.equal(tree.state.openNodes.length, 5);

    t.ok(tree.openNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, 12);
    t.equal(tree.state.openNodes.length, 6);

    tree.closeNode(tree.getNodeById('hotel'));
    t.equal(tree.nodes.length, 10);
    t.equal(tree.state.openNodes.length, 5);

    t.notOk(tree.closeNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, 10);
    t.equal(tree.state.openNodes.length, 5);

    // Check event fired count
    t.equal(eventFiredCount, 5);

    // Should be able to open existed hidden node (happening async loaded children appended to a
    // node, which was collapsed till data was fully loaded).
    t.notOk(tree.openNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, 10);
    t.equal(tree.state.openNodes.length, 5);

    // Check event fired count
    t.equal(eventFiredCount, 5);

    // Open the node again should not change the result of tree.state.openNodes
    t.notOk(tree.openNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, 10);
    t.equal(tree.state.openNodes.length, 5);

    // Check event fired count
    t.equal(eventFiredCount, 5); // should not fire event

    t.end();
});

test('tree.moveNodeTo', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    { // Move "alpha" to "bravo"
        const root = tree.getNodeById('<root>');
        const alpha = tree.getNodeById('alpha');
        const bravo = tree.getNodeById('bravo');
        t.equal(root.children.indexOf(alpha), 0);
        t.equal(root.children.indexOf(bravo), 1);
        t.ok(tree.moveNodeTo(alpha, bravo));
        t.equal(root.children.indexOf(alpha), -1);
        t.equal(root.children.indexOf(bravo), 0);
        t.equal(bravo.children.indexOf(alpha), 3);
    }

    { // Move "bravo" to "root"
        const root = tree.getNodeById('<root>');
        const bravo = tree.getNodeById('bravo');
        t.equal(bravo.parent, root);
        t.notOk(tree.moveNodeTo(root, bravo));
        t.equal(bravo.parent, root);
    }

    t.end();
});

test('tree.removeChildNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    const nodesLength = tree.nodes.length;

    // Select a node
    t.ok(tree.selectNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, nodesLength);

    { // #1: Pass empty parameters
        t.notOk(tree.removeChildNodes());
        t.equal(tree.nodes.length, nodesLength);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo',
            'charlie',
            'delta',
            'hotel',
            'india'
        ]);
    }

    { // #2: Remove child nodes of "hotel"
        const node = tree.getNodeById('hotel');
        t.ok(tree.removeChildNodes(node));
        t.equal(node.children.length, 0);
        t.equal(tree.nodes.length, nodesLength - 2);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo',
            'charlie',
            'delta'
        ]);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('hotel'));
    }

    { // #3: Remove child nodes of "charlie"
        const node = tree.getNodeById('charlie');
        t.ok(tree.removeChildNodes(node));
        t.equal(node.children.length, 0);
        t.equal(tree.nodes.length, nodesLength - 2 - 4);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo'
        ]);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('hotel'));
    }

    { // #4: Remove child nodes of "<root>"
        const node = tree.getNodeById('<root>');
        t.ok(tree.removeChildNodes(node));
        t.equal(node.children.length, 0);
        t.equal(tree.nodes.length, 1);
        t.strictSame(tree.state.openNodes.map(node => node.id), []);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('<root>'));
    }

    { // #5: Remove child nodes of root node
        const rootNode = tree.getRootNode();
        t.ok(tree.removeChildNodes(rootNode));
        t.equal(tree.nodes.length, 0);
        t.strictSame(tree.getSelectedNode(), null);
        t.strictSame(tree.getRootNode(), rootNode, 'the root node should not be changed');
    }

    t.end();
});

test('tree.removeNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    const nodesLength = tree.nodes.length;

    // Select a node
    t.ok(tree.selectNode(tree.getNodeById('india')));
    t.equal(tree.nodes.length, nodesLength);

    { // #1: Pass empty parameters
        t.notOk(tree.removeNode());
        t.equal(tree.nodes.length, nodesLength);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo',
            'charlie',
            'delta',
            'hotel',
            'india'
        ]);
    }

    { // #2: Remove "hotel"
        const node = tree.getNodeById('hotel');
        t.ok(tree.removeNode(node));
        t.equal(tree.nodes.length, nodesLength - 3);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo',
            'charlie',
            'delta'
        ]);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('kilo'), 'the next sibling node of "hotel" is "kilo"');
    }

    { // #3: Remove "kilo"
        const node = tree.getNodeById('kilo');
        t.ok(tree.removeNode(node));
        t.equal(tree.nodes.length, nodesLength - 3 - 1);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>',
            'bravo',
            'charlie',
            'delta'
        ]);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('charlie'), 'the previous sibling node of "kilo" is charlie"');
    }

    { // #4: Remove "charlie"
        const node = tree.getNodeById('charlie');
        t.ok(tree.removeNode(node));
        t.equal(tree.nodes.length, nodesLength - 3 - 1 - 5);
        t.strictSame(tree.state.openNodes.map(node => node.id), [
            '<root>'
        ]);
        t.strictSame(tree.getSelectedNode(), tree.getNodeById('bravo'), 'the parent node of "charlie" is "bravo"');
    }

    { // #5: Remove "<root>"
        const node = tree.getNodeById('<root>');
        t.ok(tree.removeNode(node));
        t.equal(tree.nodes.length, 0);
        t.strictSame(tree.state.openNodes.map(node => node.id), []);
        t.strictSame(tree.getSelectedNode(), null, 'no more selected node');
    }

    { // #6: Remove root node
        const rootNode = tree.getRootNode();
        t.notOk(tree.removeNode(rootNode), 'root node cannot be removed');
        t.strictSame(tree.getRootNode(), rootNode, 'the root node should not be changed');
    }

    t.end();
});

test('tree.selectNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    let eventFiredCount = 0;

    tree.on('selectNode', (node) => {
        ++eventFiredCount;
    });

    // Select Node
    t.notOk(tree.selectNode());
    t.strictSame(tree.getSelectedNode(), null);
    tree.selectNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('<root>'));
    tree.selectNode(tree.getNodeById('bravo'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('bravo'));
    tree.selectNode(tree.getNodeById('charlie'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('charlie'));
    tree.selectNode(tree.getNodeById('hotel'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('hotel'));
    tree.selectNode(tree.getNodeById('delta'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('delta'));
    tree.selectNode(tree.getNodeById('india'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('india'));
    tree.selectNode(tree.getNodeById('juliet'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('juliet'));

    // Check event fired count
    t.strictSame(eventFiredCount, 6);

    // Close Node
    tree.closeNode(tree.getNodeById('india'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('india'));
    tree.closeNode(tree.getNodeById('hotel'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('hotel'));
    tree.closeNode(tree.getNodeById('bravo'));
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('bravo'));
    tree.closeNode(tree.getNodeById('<root>'), { silent: true });
    t.strictSame(tree.getSelectedNode(), tree.getNodeById('<root>'));

    // Check event fired count
    t.strictSame(eventFiredCount, 6 + 3);

    t.end();
});

test('tree.swapNodes', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    { // Swap "alpha" and "bravo"
        const root = tree.getNodeById('<root>');
        const alpha = tree.getNodeById('alpha');
        const bravo = tree.getNodeById('bravo');
        t.equal(root.children.indexOf(alpha), 0);
        t.equal(root.children.indexOf(bravo), 1);
        t.ok(tree.swapNodes(alpha, bravo));
        t.equal(root.children.indexOf(alpha), 1);
        t.equal(root.children.indexOf(bravo), 0);
    }

    { // Swap "bravo" and "delta"
        const root = tree.getNodeById('<root>');
        const bravo = tree.getNodeById('bravo');
        const charlie = tree.getNodeById('charlie');
        const delta = tree.getNodeById('delta');
        t.equal(bravo.parent, root);
        t.equal(delta.parent, charlie);
        t.notOk(tree.swapNodes(bravo, delta));
        t.equal(bravo.parent, root);
        t.equal(delta.parent, charlie);
    }

    { // Swap "alpha" and "delta"
        const root = tree.getNodeById('<root>');
        const alpha = tree.getNodeById('alpha');
        const bravo = tree.getNodeById('bravo');
        const charlie = tree.getNodeById('charlie');
        const delta = tree.getNodeById('delta');
        t.equal(alpha.parent, root);
        t.equal(delta.parent, charlie);
        t.ok(tree.swapNodes(alpha, delta));
        t.equal(alpha.parent, charlie);
        t.equal(delta.parent, root);
    }

    t.end();
});

test('tree.toggleNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    let eventFiredCount = 0;

    tree.on('openNode', (node) => {
        ++eventFiredCount;
    });

    tree.on('closeNode', (node) => {
        ++eventFiredCount;
    });

    // Toggle Node
    t.notOk(tree.toggleNode());
    t.equal(tree.nodes.length, 1);
    tree.toggleNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.equal(tree.nodes.length, 3);
    tree.toggleNode(tree.getNodeById('bravo'));
    t.equal(tree.nodes.length, 6);
    tree.toggleNode(tree.getNodeById('charlie'));
    t.equal(tree.nodes.length, 8);
    tree.toggleNode(tree.getNodeById('hotel'));
    t.equal(tree.nodes.length, 9);
    tree.toggleNode(tree.getNodeById('delta'));
    t.equal(tree.nodes.length, 11);
    tree.toggleNode(tree.getNodeById('india'));
    t.equal(tree.nodes.length, 12);
    tree.toggleNode(tree.getNodeById('<root>'), { silent: true }); // Prevent event from being triggered
    t.equal(tree.nodes.length, 1);

    // Check event fired count
    t.equal(eventFiredCount, 5);

    t.end();
});

test('tree.toString', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    { // #1: Serialize the tree
        const found = tree.toString();
        const wanted = '[{"id":null,"children":[{"id":"<root>","children":[],"state":{"depth":0,"open":false,"path":".0","prefixMask":"0","total":0},"label":"<root>"},{"id":"<root>","children":[{"id":"bravo","children":[{"id":"charlie","children":[{"id":"delta","children":[],"state":{"depth":3,"open":false,"path":".0.1.0.0","prefixMask":"0001","total":0},"label":"Delta"},{"id":"delta","children":[],"state":{"depth":3,"open":false,"path":".0.1.0.0","prefixMask":"0001","total":0},"label":"Delta"}],"state":{"depth":2,"open":false,"path":".0.1.0","prefixMask":"000","total":0},"label":"Charlie"},{"id":"charlie","children":[],"state":{"depth":2,"open":false,"path":".0.1.0","prefixMask":"000","total":0},"label":"Charlie"}],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0},"label":"Bravo"},{"id":"bravo","children":[{"id":"hotel","children":[{"id":"india","children":[],"state":{"depth":3,"open":false,"path":".0.1.1.0","prefixMask":"0001","total":0},"label":"India"}],"state":{"depth":2,"open":false,"path":".0.1.1","prefixMask":"000","total":0},"label":"Hotel"}],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0},"label":"Bravo"},{"id":"bravo","children":[],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0},"label":"Bravo"}],"state":{"depth":0,"open":false,"path":".0","prefixMask":"0","total":0},"label":"<root>"}],"state":{"depth":-1,"open":true,"path":"","prefixMask":"","total":1}}]';
        t.strictSame(JSON.parse(found), JSON.parse(wanted));
    }

    { // #2: Serialize a node
        const found = tree.toString(tree.getNodeById('bravo'));
        const wanted = '[{"id":"bravo","label":"Bravo","children":[{"id":"charlie","label":"Charlie","children":[{"id":"delta","label":"Delta","children":[],"state":{"depth":3,"open":false,"path":".0.1.0.0","prefixMask":"0001","total":0}},{"id":"delta","label":"Delta","children":[],"state":{"depth":3,"open":false,"path":".0.1.0.0","prefixMask":"0001","total":0}}],"state":{"depth":2,"open":false,"path":".0.1.0","prefixMask":"000","total":0}},{"id":"charlie","label":"Charlie","children":[],"state":{"depth":2,"open":false,"path":".0.1.0","prefixMask":"000","total":0}}],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0}},{"id":"bravo","label":"Bravo","children":[{"id":"hotel","label":"Hotel","children":[{"id":"india","label":"India","children":[],"state":{"depth":3,"open":false,"path":".0.1.1.0","prefixMask":"0001","total":0}}],"state":{"depth":2,"open":false,"path":".0.1.1","prefixMask":"000","total":0}}],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0}},{"id":"bravo","label":"Bravo","children":[],"state":{"depth":1,"open":false,"path":".0.1","prefixMask":"00","total":0}}]';
        t.strictSame(JSON.parse(found), JSON.parse(wanted));
    }

    t.end();
});

test('tree.unfilter', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: getTreeData()
    });

    // Filter
    tree.filter();
    t.equal(tree.filtered, true);

    // Unfilter
    tree.unfilter();
    t.equal(tree.filtered, false);
    const found = tree.flattenChildNodes()
        .filter(node => node.state.filtered === undefined)
        .map(node => node.label);
    const wanted = [
        '<root>',
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
        'Echo',
        'Foxtrot',
        'Golf',
        'Hotel',
        'India',
        'Juliet',
        'Kilo'
    ];
    t.strictSame(found, wanted);

    t.end();
});

test('tree.update', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    let eventFiredCount = 0;

    tree.on('contentWillUpdate', () => {
        ++eventFiredCount;
    });
    tree.on('contentDidUpdate', () => {
        ++eventFiredCount;
    });

    tree.update();
    t.equal(eventFiredCount, 2);

    t.end();
});

test('tree.updateNode', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: getTreeData()
    });

    { // #1: Update props
        const node = tree.getNodeById('<root>');
        const lastUpdated = new Date().getTime();
        tree.updateNode(node, {
            props: {
                lastUpdated: lastUpdated
            }
        });

        const wanted = {
            lastUpdated: lastUpdated
        };
        t.strictSame(node.props, wanted);
    }

    { // #2: Update node id
        const node = tree.getNodeById('<root>');
        t.equal(node.id, '<root>');

        t.equal(tree.nodeTable.get('<root>'), node);
        t.equal(tree.nodeTable.get('<root.0>'), undefined);

        tree.updateNode(node, { id: '<root.0>' });
        t.equal(node.id, '<root.0>');

        t.equal(tree.nodeTable.get('<root>'), undefined);
        t.equal(tree.nodeTable.get('<root.0>'), node);
        t.equal(tree.getNodeById('<root>'), null);
        t.equal(tree.getNodeById('<root.0>'), node);

        tree.updateNode(node, { id: '<root>' });
        t.equal(node.id, '<root>');
        t.equal(tree.nodeTable.get('<root>'), node);
        t.equal(tree.nodeTable.get('<root.0>'), undefined);
        t.equal(tree.getNodeById('<root>'), node);
        t.equal(tree.getNodeById('<root.0>'), null);

        tree.updateNode(node, { id: undefined });
        t.equal(node.id, '<root>');
        tree.updateNode(node, { id: null });
        t.equal(node.id, '<root>');
    }

    t.end();
});
