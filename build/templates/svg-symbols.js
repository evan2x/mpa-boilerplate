(function(doc) {
  var fragment = '<svg<%= attributesToString(svgAttrs) %>><% if (defs) { %><defs><%= defs.trim() %></defs><% } %><%= icons.map(function(icon) { return svgdataToSymbol(icon).replace(/\s*[\r\n]\s*/g, "").replace(/>\s*</g, "><"); }).join("") %></svg>';
  function insert() {
    var container = doc.createElement('div');

    container.innerHTML = fragment;
    fragment = null;

    var svg = container.getElementsByTagName('svg')[0];
    svg.style.cssText = 'position: absolute; display: none;';
    svg.setAttribute("aria-hidden", "true");
    
    var firstChild = doc.body.firstChild;

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
})(document);
