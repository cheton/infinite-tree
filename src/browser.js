// https://gist.github.com/padolsey/527683#comment-786682
export const getIEVersion = () => {
    const div = document.createElement('div');
    const all = div.getElementsByTagName('i') || [];

    let v = 3;
    do {
        ++v;
        div.innerHTML = '<!--[if gt IE ' + v + ']><i></i><![endif]-->';
    } while (all[0]);

    return v > 4 ? v : document.documentMode;
};
