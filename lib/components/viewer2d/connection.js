'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Connection;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SELECTED_STROKE = '#f00';
var DEFAULT_STROKE = '#0066cc';
var STROKE_WIDTH = 3;
var HIT_AREA_WIDTH = 12;

function Connection(_ref) {
  var layer = _ref.layer,
      connection = _ref.connection;

  var startItem = layer.getIn(['items', connection.startItemId]);
  var endItem = layer.getIn(['items', connection.endItemId]);

  if (!startItem || !endItem) return null;

  var stroke = connection.selected ? SELECTED_STROKE : DEFAULT_STROKE;

  return _react2.default.createElement(
    'g',
    {
      'data-element-root': true,
      'data-prototype': 'connections',
      'data-id': connection.id,
      'data-selected': connection.selected,
      'data-layer': layer.id,
      style: { cursor: connection.selected ? 'pointer' : 'default' }
    },
    _react2.default.createElement('line', {
      x1: startItem.x,
      y1: startItem.y,
      x2: endItem.x,
      y2: endItem.y,
      stroke: 'transparent',
      strokeWidth: HIT_AREA_WIDTH
    }),
    _react2.default.createElement('line', {
      x1: startItem.x,
      y1: startItem.y,
      x2: endItem.x,
      y2: endItem.y,
      stroke: stroke,
      strokeWidth: STROKE_WIDTH,
      strokeLinecap: 'round'
    })
  );
}

Connection.propTypes = {
  layer: _propTypes2.default.object.isRequired,
  connection: _propTypes2.default.object.isRequired
};