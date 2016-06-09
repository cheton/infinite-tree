import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import jsdom from 'jsdom';

const document = jsdom.jsdom(undefined, {
    virtualConsole: jsdom.createVirtualConsole().sendTo(console)
});
const window = document.defaultView;

global.document = document;
global.window = window;
global.navigator = window.navigator;

const treeData = Object.freeze(require('./fixtures/tree.json'));
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

test('Close all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: false,
        data: { ...treeData }
    });

    t.same(tree.nodes.length, 1);
    t.same(tree.rows.length, 1);
    t.end();
});

test('Open all nodes on tree initialization', (t) => {
    const el = getTreeElement();
    const tree = new InfiniteTree(el, {
        autoOpen: true,
        data: { ...treeData }
    });

    t.same(tree.nodes.length, 12);
    t.same(tree.rows.length, 12);
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

    t.same(window.document.body.innerHTML, innerHTML);
    t.same(tree.nodes.length, 0);
    t.same(tree.rows.length, 0);
    t.end();
});
