(function() {

var hasClass = (el, className) => {
    if (!el) {
        return false;
    }
    var classes = el.className.split(' ');
    return (classes.indexOf(className) >= 0);
};

var addClass = (el, className) => {
    if (!el) {
        return '';
    }
    if (!hasClass(el, className)) {
        var classes = el.className.split(' ');
        el.className = classes.concat(className).join(' ');
    }
    return el.className;
};

var removeClass = (el, className) => {
    if (!el) {
        return '';
    }
    if (hasClass(el, className)) {
        var classes = el.className.split(' ');
        el.className = classes.filter(c => (c !== className)).join(' ');
    }
    return el.className;
};

var toggleClass = (el, className) => {
    if (!el) {
        return;
    }
    if (hasClass(el, className)) {
        removeClass(el, className);
    } else {
        addClass(el, className);
    }
};

var addEventListener = (target, type, listener) => {
    if (target.addEventListener) { // Standard
        target.addEventListener(type, listener, false);
    } else if (target.attachEvent) { // IE8
        // In Internet Explorer versions before IE 9, you have to use attachEvent rather than the standard addEventListener.
        target.attachEvent('on' + type, listener);
    }
};

addEventListener(document.querySelector('.navbar-toggle'), 'click', function(e) {
    toggleClass(document.querySelector('.navbar-collapse'), 'in');
});

})();
