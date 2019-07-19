(function (doc) {
  let fragment = '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon-right-circle" viewBox="0 0 1024 1024"><path d="M512 0.999C229.476 0.999 0.5 229.975 0.5 512.499S229.476 1024 512 1024s511.5-228.976 511.5-511.5S794.524 0.999 512 0.999z m169.335 536.676l-235.57 220.784c-14.486 13.587-37.264 12.888-50.85-1.598-13.587-14.486-12.888-37.264 1.598-50.85L604.11 511.5 396.613 316.89c-14.486-13.587-15.185-36.365-1.599-50.85 13.587-14.487 36.365-15.186 50.85-1.6l235.57 220.785c7.194 6.694 11.29 16.184 11.29 26.175s-4.096 19.58-11.39 26.274z" p-id="3928"/></symbol></svg>';
  function insert() {
    let container = doc.createElement('div');

    container.innerHTML = fragment;
    fragment = null;

    let svg = container.getElementsByTagName('svg')[0];
    svg.style.cssText = 'position: absolute; display: none;';
    svg.setAttribute('aria-hidden', 'true');

    let { firstChild } = doc.body;

    if (firstChild) {
      firstChild.parentNode.insertBefore(svg, firstChild);
    } else {
      doc.body.appendChild(svg);
    }

    container = null;
  }

  function handler() {
    doc.removeEventListener('DOMContentLoaded', handler, false);
    insert();
  }

  doc.addEventListener('DOMContentLoaded', handler, false);
}(document));
