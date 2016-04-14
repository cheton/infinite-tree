import { addClass, removeClass, addEventListener } from '../src/helper';
import './classic';
import './filebrowser';

let activeTarget = null;

const sidebar = document.getElementById('sidebar');
addEventListener(sidebar, 'click', (e) => {
    const target = e.target || e.srcElement;
    let itemTarget = target;

    if (target.nodeName !== 'A') {
        return;
    }

    while (itemTarget && itemTarget.parentElement !== sidebar) {
        itemTarget = itemTarget.parentElement;
    }

    if (activeTarget) {
        removeClass(activeTarget, 'active');
    }
    activeTarget = itemTarget;
    addClass(activeTarget, 'active');
});
