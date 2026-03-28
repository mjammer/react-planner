import React from 'react';
import PropTypes from 'prop-types';

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

export default function Connection2D(_ref) {
  var layer = _ref.layer,
      connection = _ref.connection;

  var startItem = layer.getIn(['items', connection.startItemId]);
  var endItem = layer.getIn(['items', connection.endItemId]);

  if (!startItem || !endItem) return null;

  var style = connection.selected ? STYLE_SELECTED : STYLE_DEFAULT;

  return React.createElement(
    'g',
    {
      'data-element-root': true,
      'data-prototype': connection.prototype,
      'data-id': connection.id,
      'data-selected': connection.selected,
      'data-layer': layer.id
    },
    React.createElement('line', {
      x1: startItem.x, y1: startItem.y,
      x2: endItem.x, y2: endItem.y,
      style: style
    }),
    connection.selected && React.createElement(
      'g',
      null,
      React.createElement('circle', { cx: startItem.x, cy: startItem.y, r: '5', fill: '#ff5722' }),
      React.createElement('circle', { cx: endItem.x, cy: endItem.y, r: '5', fill: '#ff5722' })
    )
  );
}

Connection2D.propTypes = {
  connection: PropTypes.object.isRequired,
  layer: PropTypes.object.isRequired
};