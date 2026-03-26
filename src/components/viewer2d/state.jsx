import React from 'react';
import PropTypes from 'prop-types';
import Scene from './scene';
import Snap from './snap';
import * as SharedStyle from '../../shared-style';
import { MODE_DRAWING_CONNECTION } from '../../constants';

const guideStyle = {
  stroke: SharedStyle.SECONDARY_COLOR.main,
  strokewidth:'2.5px'
};

const connectionDrawingStyle = {
  stroke: '#0096fd',
  strokeWidth: '3px',
  strokeDasharray: '8,4',
  fill: 'none',
  pointerEvents: 'none'
};

export default function State({state, catalog}) {

  let {activeSnapElement, snapElements, scene, mode, drawingSupport} = state;
  let {width, height} = scene;

  activeSnapElement = activeSnapElement ?
    <Snap snap={activeSnapElement} width={scene.width} height={scene.height}/> : null;
// snapElements = snapElements.map((snap,id) => <Snap key={id} snap={snap} width={scene.width} height={scene.height}/>);
  snapElements = null; //only for debug purpose

  let connectionDrawingLine = null;
  if (mode === MODE_DRAWING_CONNECTION && drawingSupport.get('startItemId')) {
    let layerID = drawingSupport.get('layerID') || scene.selectedLayer;
    let layer = scene.getIn(['layers', layerID]);
    let startItem = layer && layer.getIn(['items', drawingSupport.get('startItemId')]);
    let currentX = drawingSupport.get('currentX');
    let currentY = drawingSupport.get('currentY');

    if (startItem && currentX !== undefined && currentY !== undefined) {
      connectionDrawingLine = (
        <line
          x1={startItem.x} y1={startItem.y}
          x2={currentX} y2={currentY}
          style={connectionDrawingStyle}
        />
      );
    }
  }

  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill={SharedStyle.COLORS.white}/>
      <g transform={`translate(0, ${scene.height}) scale(1, -1)`} id="svg-drawing-paper">

        <Scene scene={scene} catalog={catalog}/>
        {scene.getIn(['guides','horizontal']).entrySeq().map( ([ hgKey, hgVal ]) => <line id={'hGuide' + hgKey} key={hgKey} x1={0} y1={hgVal} x2={width} y2={hgVal} style={guideStyle}/> )}
        {scene.getIn(['guides','vertical']).entrySeq().map( ([ vgKey, vgVal ]) => <line key={vgKey} x1={vgVal} y1={0} x2={vgVal} y2={height} style={guideStyle}/> )}
        {activeSnapElement}
        {snapElements}
        {connectionDrawingLine}

      </g>
    </g>
  )
}

State.propTypes = {
  state: PropTypes.object.isRequired,
  catalog: PropTypes.object.isRequired
};
