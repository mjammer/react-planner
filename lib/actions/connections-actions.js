'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectConnection = selectConnection;
exports.selectToolDrawingConnection = selectToolDrawingConnection;
exports.beginDrawingConnection = beginDrawingConnection;
exports.updateDrawingConnection = updateDrawingConnection;
exports.endDrawingConnection = endDrawingConnection;
exports.removeConnection = removeConnection;

var _constants = require('../constants');

function selectConnection(layerID, connectionID) {
  return {
    type: _constants.SELECT_CONNECTION,
    layerID: layerID,
    connectionID: connectionID
  };
}

function selectToolDrawingConnection(startItemId) {
  return {
    type: _constants.SELECT_TOOL_DRAWING_CONNECTION,
    startItemId: startItemId
  };
}

function beginDrawingConnection(layerID, startItemId) {
  return {
    type: _constants.BEGIN_DRAWING_CONNECTION,
    layerID: layerID,
    startItemId: startItemId
  };
}

function updateDrawingConnection(x, y) {
  return {
    type: _constants.UPDATE_DRAWING_CONNECTION,
    x: x, y: y
  };
}

function endDrawingConnection(layerID, endItemId) {
  return {
    type: _constants.END_DRAWING_CONNECTION,
    layerID: layerID,
    endItemId: endItemId
  };
}

function removeConnection(layerID, connectionID) {
  return {
    type: _constants.REMOVE_CONNECTION,
    layerID: layerID,
    connectionID: connectionID
  };
}