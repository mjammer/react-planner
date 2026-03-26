import React from 'react';
import PropTypes from 'prop-types';

const SELECTED_STROKE = '#f00';
const DEFAULT_STROKE = '#0066cc';
const STROKE_WIDTH = 3;
const HIT_AREA_WIDTH = 12;

export default function Connection({ layer, connection }) {
  let startItem = layer.getIn(['items', connection.startItemId]);
  let endItem = layer.getIn(['items', connection.endItemId]);

  if (!startItem || !endItem) return null;

  let stroke = connection.selected ? SELECTED_STROKE : DEFAULT_STROKE;

  return (
    <g
      data-element-root
      data-prototype="connections"
      data-id={connection.id}
      data-selected={connection.selected}
      data-layer={layer.id}
      style={{ cursor: connection.selected ? 'pointer' : 'default' }}
    >
      {/* invisible hit area for easier clicking */}
      <line
        x1={startItem.x}
        y1={startItem.y}
        x2={endItem.x}
        y2={endItem.y}
        stroke="transparent"
        strokeWidth={HIT_AREA_WIDTH}
      />
      <line
        x1={startItem.x}
        y1={startItem.y}
        x2={endItem.x}
        y2={endItem.y}
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
    </g>
  );
}

Connection.propTypes = {
  layer: PropTypes.object.isRequired,
  connection: PropTypes.object.isRequired,
};
