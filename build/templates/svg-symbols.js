(function (doc) {
  // eslint-disable-next-line
  let fragment = '<svg<%= attributesToString(svgAttrs) %>><% if (defs) { %><defs><%= defs.trim() %></defs><% } %><%= icons.map(function(icon) { return svgdataToSymbol(icon).replace(/\s*[\r\n]\s*/g, "").replace(/>\s*</g, "><"); }).join("") %></svg>';
  function insert() {
    let container = doc.createElement('div');

    container.innerHTML = fragment;
    fragment = null;

    let svg = container.getElementsByTagName('svg')[0];
    svg.style.cssText = 'position: absolute; width: 0px; height: 0px; overflow: hidden;';
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
