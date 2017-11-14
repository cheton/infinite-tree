import elementClass from 'element-class';
import { addEventListener } from '../src/dom';
import '../src/index.styl';
import * as _default from './default';
import * as classic from './classic';
import * as filebrowser from './filebrowser';

const routes = {
    'default': () => {
        _default.load();
    },
    'classic': () => {
        classic.load();
    },
    'filebrowser': () => {
        filebrowser.load();
    }
};

let activeSectionId = window.location.hash.substr(2) || 'default';

elementClass(document.querySelector('#main .loading')).add('hidden');
elementClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode).add('active');
elementClass(document.querySelector('section[id="' + activeSectionId + '"]')).add('active');
routes[activeSectionId] && routes[activeSectionId]();

addEventListener(document.getElementById('sidebar'), 'click', (e) => {
    const target = e.target || e.srcElement;
    let itemTarget = target;

    if (target.nodeName !== 'A') {
        return;
    }

    if (activeSectionId) {
        elementClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode).remove('active');
        elementClass(document.querySelector('section[id="' + activeSectionId + '"]')).remove('active');
    }

    activeSectionId = target.getAttribute('data-section-id');

    elementClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode).add('active');
    elementClass(document.querySelector('section[id="' + activeSectionId + '"]')).add('active');
    routes[activeSectionId] && routes[activeSectionId]();
});
