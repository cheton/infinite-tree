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

export {
    preventDefault,
    stopPropagation,
    dispatchEvent,
    addEventListener,
    removeEventListener,
    isDOMElement,
    isDOMNode
};
