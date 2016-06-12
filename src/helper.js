/* eslint no-restricted-syntax: 0 */
const preventDefault = (e) => {
    if (typeof e.preventDefault !== 'undefined') {
        e.preventDefault();
    } else {
        e.returnValue = false;
    }
};

const stopPropagation = (e) => {
    if (typeof e.stopPropagation !== 'undefined') {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }
};

// http://blog.garstasio.com/you-dont-need-jquery/events/#sending-custom-events
const dispatchEvent = (el, eventType) => {
    const evt = document.createEvent('Event');
    evt.initEvent(eventType, true, true); // can bubble, and is cancellable
    el.dispatchEvent(evt);
};

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Compatibility
const addEventListener = (target, type, listener) => {
    if (target.addEventListener) { // Standard
        target.addEventListener(type, listener, false);
    } else if (target.attachEvent) { // IE8
        // In Internet Explorer versions before IE 9, you have to use attachEvent rather than the standard addEventListener.
        target.attachEvent('on' + type, listener);
    }
};

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
const removeEventListener = (target, type, listener) => {
    if (target.removeEventListener) { // Standard
        target.removeEventListener(type, listener, false);
    } else if (target.detachEvent) { // IE8
        // In Internet Explorer versions before IE 9, you have to use detachEvent rather than the standard removeEventListener.
        target.detachEvent('on' + type, listener);
    }
};

const hasClass = (el, className) => {
    if (!el) {
        return false;
    }
    const classes = el.className.split(' ');
    return (classes.indexOf(className) >= 0);
};

const addClass = (el, className) => {
    if (!el) {
        return '';
    }
    if (!hasClass(el, className)) {
        let classes = el.className.split(' ');
        el.className = classes.concat(className).join(' ');
    }
    return el.className;
};

const removeClass = (el, className) => {
    if (!el) {
        return '';
    }
    if (hasClass(el, className)) {
        let classes = el.className.split(' ');
        el.className = classes.filter(c => (c !== className)).join(' ');
    }
    return el.className;
};

const toggleClass = (el, className) => {
    if (!el) {
        return;
    }
    if (hasClass(el, className)) {
        removeClass(el, className);
    } else {
        addClass(el, className);
    }
};

// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object

//Returns true if it is a DOM element
const isDOMElement = (o) => {
    if (typeof HTMLElement === 'object') {
        return o instanceof HTMLElement;
    }
    return o && typeof o === 'object' && o.nodeType === 1 && typeof o.nodeName === 'string';
};

// Returns true if it is a DOM node
const isDOMNode = (o) => {
    if (typeof Node === 'object') {
        return o instanceof Node;
    }
    return o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
};

const quoteattr = (s, preserveCR) => {
    preserveCR = preserveCR ? '&#13;' : '\n';
    return ('' + s) /* Forces the conversion to string. */
        .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
        .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        /*
         * You may add other replacements here for HTML only
         * (but it's not necessary).
         * Or for XML, only if the named entities are defined in its DTD.
         */
        .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
        .replace(/[\r\n]/g, preserveCR);
};

/**
 * Example #1:
 * =========================================================================
 * <a id="mymail href="http://mymail.example.com">My Mail</a>
 *
 * buildHTML('a', 'My Mail', {
 *     id: 'mymail',
 *     href: 'http://mymail.example.com'
 * });
 *
 * Example #2:
 * =========================================================================
 * <input id="myinput" type="text" value="myvalue" />
 *
 * buildHTML('input', {
 *   id: 'myinput',
 *   type: 'text',
 *   value: 'myvalue'
 * });
 *
 */
const buildHTML = (tag, html, attrs) => {
    switch (tag) {
    case 'select':
        if (typeof(html) === 'object') {
            let options = html || {};
            html = '';
            for (let value in options) {
                if (!options.hasOwnProperty(value)) {
                    continue;
                }
                html += buildHTML('option', options[value] || '', { value: value });
            }
        }
        break;

    default:
        if (typeof(html) === 'object') {
            attrs = html;
            html = undefined;
        }
        break;
    }

    let h = '<' + tag;
    for (let attr in attrs) {
        if (!attrs.hasOwnProperty(attr)) {
            continue;
        }
        if (typeof attrs[attr] !== 'undefined') {
            h += ' ' + attr + '="' + quoteattr(attrs[attr]) + '"';
        }
    }
    h += (typeof(html) !== 'undefined') ? '>' + html + '</' + tag + '>' : '/>';

    return h;
};

export {
    preventDefault,
    stopPropagation,
    dispatchEvent,
    addEventListener,
    removeEventListener,
    hasClass,
    addClass,
    removeClass,
    toggleClass,
    isDOMElement,
    isDOMNode,
    quoteattr,
    buildHTML
};
