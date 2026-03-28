import React from 'react';
import PropTypes from 'prop-types';

const STYLE_DEFAULT = {
  stroke: '#0096fd',
  strokeWidth: '3px',
  fill: 'none',
  pointerEvents: 'visibleStroke',
  cursor: 'pointer'
};

const STYLE_SELECTED = {
  stroke: '#ff5722',
  strokeWidth: '4px',
  fill: 'none',
  pointerEvents: 'visibleStroke',
  cursor: 'pointer'
};

export default function Connection2D({ layer, connection }) {
  let startItem = layer.getIn(['items', connection.startItemId]);
  let endItem = layer.getIn(['items', connection.endItemId]);

  if (!startItem || !endItem) return null;

  let style = connection.selected ? STYLE_SELECTED : STYLE_DEFAULT;

  return (
    <g
      data-element-root
      data-prototype={connection.prototype}
      data-id={connection.id}
      data-selected={connection.selected}
      data-layer={layer.id}
    >
      <line
        x1={startItem.x} y1={startItem.y}
        x2={endItem.x} y2={endItem.y}
        style={style}
      />
      {connection.selected && (
        <g>
          <circle cx={startItem.x} cy={startItem.y} r="5" fill="#ff5722" />
          <circle cx={endItem.x} cy={endItem.y} r="5" fill="#ff5722" />
        </g>
      )}
    </g>
  );
}

Connection2D.propTypes = {
  connection: PropTypes.object.isRequired,
  layer: PropTypes.object.isRequired
};
