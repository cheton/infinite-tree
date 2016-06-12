import { test } from 'tap';
import fs from 'fs';
import path from 'path';
import jsdom from 'jsdom';
import * as helper from '../src/helper';

const document = jsdom.jsdom(undefined, {
    virtualConsole: jsdom.createVirtualConsole().sendTo(console)
});
const window = document.defaultView;

global.document = document;
global.window = window;
global.navigator = window.navigator;

test('isDOMElement', (t) => {
    const { isDOMElement } = helper;

    const el = document.createElement('div');
    t.ok(isDOMElement(el));
    t.notOk(isDOMElement(new Object()));

    t.end();
});

test('isDOMNode', (t) => {
    const { isDOMNode } = helper;

    const el = document.createElement('div');
    t.ok(isDOMNode(el));
    t.notOk(isDOMNode(new Object()));

    t.end();
});
