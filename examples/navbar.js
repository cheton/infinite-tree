import { addEventListener, toggleClass } from '../src/helper';

addEventListener(document.querySelector('.navbar-toggle'), 'click', function(e) {
    toggleClass(document.querySelector('.navbar-collapse'), 'in');
});
