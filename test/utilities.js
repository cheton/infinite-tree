import { test } from 'tap';
import { get, trim } from '../src/utilities';

test('get', (t) => {
    const object = {
        props: {
            id: 1,
            label: 'My Company',
            count: 2,
            foo: {
                bar: {
                    baz: 'foo/bar/baz',
                    ' baz ': 'foo/bar/ baz '
                }
            },
            data: [
                { name: 'alpha', value: 0 },
                { name: 'beta', value: 0 }
            ]
        }
    };

    t.equal(get(object, '["props"]["data"][0].name'), 'alpha');
    t.equal(get(object, '["props"]["data"][1].name'), 'beta');
    t.equal(get(object, 'props["foo"]["bar"][ " baz " ]'), 'foo/bar/ baz ');
    t.equal(get(object, 'props["foo"]["bar"][" baz "]'), 'foo/bar/ baz ');
    t.equal(get(object, 'props["foo"]["bar"]["baz"]'), 'foo/bar/baz');
    t.equal(get(object, 'props["foo"]["bar"].baz'), 'foo/bar/baz');
    t.equal(get(object, 'props["foo"].bar["baz"]'), 'foo/bar/baz');
    t.equal(get(object, 'props.foo.bar.baz'), 'foo/bar/baz');
    t.equal(get(object, 'props.id'), 1);
    t.equal(get(object, 'props.idx'), undefined);
    t.equal(get(object, 'props.idx', 0), 0);

    t.end();
});

test('trim', (t) => {
    t.equal(trim(' [ "props" ] ', '\'"[] '), 'props');
    t.equal(trim('["props"]', '"[]'), 'props');
    t.equal(trim('[props]', '[]'), 'props');

    t.end();
});
