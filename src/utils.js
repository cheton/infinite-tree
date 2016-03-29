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

const classNames = (...args) => {
    let classNames = [];
    args.forEach((arg) => {
        if (Array.isArray(arg)) {
            classNames = classNames.concat(arg);
        } else if (typeof arg === 'object') {
            Object.keys(arg).forEach((className) => {
                const ok = arg[className];
                if (!!ok) {
                    classNames.push(className);
                }
            });
        } else {
            classNames.push(arg);
        }
    });
    return classNames.join(' ');
};

/**
 * The quoteattr() function is used in a context, where the result will not be evaluated by javascript but must be interpreted by an XML or HTML parser, and it must absolutely avoid breaking the syntax of an element attribute.
 */
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

export {
    buildHTML,
    classNames,
    quoteattr
};
