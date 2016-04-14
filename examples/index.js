import { Router } from 'director';
import { addClass, removeClass, addEventListener } from '../src/helper';

const routes = {
    '/classic': function() {
        console.log('classic');
    },
    '/filebrowser': function() {
        console.log('filebrowser');
    }
};

const router = Router(routes);
router.configure({
    on: () => {
    }
});
router.init();

addEventListener(document.getElementById('sidebar'), 'click', (e) => {
    const target = e.target || e.srcElement;
    if (target.nodeName !== 'A') {
        return;
    }

    addClass(target, 'active');
});
