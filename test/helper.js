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

test('classnames', (t) => {
    const { classNames } = helper;

    const result = classNames(
        'btn',
        { 'btn-default': true },
        { 'btn-primary': false },
        { 'hidden': true }
    );
    const wanted = 'btn btn-default hidden';
    t.equal(result, wanted);

    t.end();
});

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

test('quoteattr', (t) => {
    const { quoteattr } = helper;

    const result = quoteattr('&\'"&<>');
    const wanted = '&amp;&apos;&quot;&amp;&lt;&gt;';
    t.equal(result, wanted);

    t.end();
});

test('buildHTML', (t) => {
    const { buildHTML } = helper;

    { // <button></button>
        const html = buildHTML('button', 'Done', {
            class: 'btn btn-default',
            type: 'button',
            name: 'btn-done'
        });
        const wanted = '<button class="btn btn-default" type="button" name="btn-done">Done</button>';
        t.equal(html, wanted);
    }

    { // <select><option></option></select>
        const options = {
            key1: 'value1',
            key2: 'value2'
        };
        const html = buildHTML('select', options, {
            name: 'select-nv'
        });
        const wanted = '<select name="select-nv"><option value="key1">value1</option><option value="key2">value2</option></select>';
        t.equal(html, wanted);
    }

    t.end();
});
