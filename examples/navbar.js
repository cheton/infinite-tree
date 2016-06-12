import elementClass from 'element-class';
import { addEventListener } from '../src/helper';

addEventListener(document.querySelector('.navbar-toggle'), 'click', function(e) {
    elementClass(document.querySelector('.navbar-collapse')).toggle('in');
});
