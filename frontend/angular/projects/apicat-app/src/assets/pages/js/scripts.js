// scripts.js

(function (global) {

  function addCss(file) {
    var elem = document.createElement("link");
    elem.rel = " stylesheet";
    elem.href = file;
    document.head.appendChild(elem);
  }

  addCss('./assets/pages/css/custom_styles.css');

})(window);
