'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Connection2D;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var STYLE_DEFAULT = {
  stroke: '#0096fd',
  strokeWidth: '3px',
  fill: 'none',
  pointerEvents: 'visibleStroke',
  cursor: 'pointer'
};

var STYLE_SELECTED = {
  stroke: '#ff5722',
  strokeWidth: '4px',
  fill: 'none',
  pointerEvents: 'visibleStroke',
  cursor: 'pointer'
};

function Connection2D(_ref) {
  var layer = _ref.layer,
      connection = _ref.connection;

  var startItem = layer.getIn(['items', connection.startItemId]);
  var endItem = layer.getIn(['items', connection.endItemId]);

  if (!startItem || !endItem) return null;

  var style = connection.selected ? STYLE_SELECTED : STYLE_DEFAULT;

  return _react2.default.createElement(
    'g',
    {
      'data-element-root': true,
      'data-prototype': connection.prototype,
      'data-id': connection.id,
      'data-selected': connection.selected,
      'data-layer': layer.id
    },
    _react2.default.createElement('line', {
      x1: startItem.x, y1: startItem.y,
      x2: endItem.x, y2: endItem.y,
      style: style
    }),
    connection.selected && _react2.default.createElement(
      'g',
      null,
      _react2.default.createElement('circle', { cx: startItem.x, cy: startItem.y, r: '5', fill: '#ff5722' }),
      _react2.default.createElement('circle', { cx: endItem.x, cy: endItem.y, r: '5', fill: '#ff5722' })
    )
  );
}

Connection2D.propTypes = {
  connection: _propTypes2.default.object.isRequired,
  layer: _propTypes2.default.object.isRequired
};