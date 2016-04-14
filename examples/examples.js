import { addClass, removeClass, addEventListener } from '../src/helper';
import * as classic from './classic';
import * as filebrowser from './filebrowser';

const routes = {
    'classic': () => {
        classic.load();
    },
    'filebrowser': () => {
        filebrowser.load();
    }
};

const sidebar = document.getElementById('sidebar');

let activeSectionId = 'classic';

addClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode, 'active');
addClass(document.querySelector('section[id="' + activeSectionId + '"]'), 'active');
routes[activeSectionId] && routes[activeSectionId]();

addEventListener(sidebar, 'click', (e) => {
    const target = e.target || e.srcElement;
    let itemTarget = target;

    if (target.nodeName !== 'A') {
        return;
    }

    if (activeSectionId) {
        removeClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode, 'active');
        removeClass(document.querySelector('section[id="' + activeSectionId + '"]'), 'active');
    }

    activeSectionId = target.getAttribute('data-section-id');

    addClass(document.querySelector('#sidebar [data-section-id="' + activeSectionId + '"]').parentNode, 'active');
    addClass(document.querySelector('section[id="' + activeSectionId + '"]'), 'active');
    routes[activeSectionId] && routes[activeSectionId]();
});
