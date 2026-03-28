var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NameGenerator = function () {
  function NameGenerator() {
    _classCallCheck(this, NameGenerator);
  }

  _createClass(NameGenerator, null, [{
    key: "generateName",
    value: function generateName(prototype, type) {
      var normalizedType = typeof type === 'string' && type.trim() ? type.trim() : typeof prototype === 'string' && prototype.trim() ? prototype.trim() : 'element';

      return normalizedType.substr(0, 1).toUpperCase() + normalizedType.substr(1);
    }
  }]);

  return NameGenerator;
}();

export default NameGenerator;