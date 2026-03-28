import {
  SELECT_CONNECTION,
  SELECT_TOOL_DRAWING_CONNECTION,
  BEGIN_DRAWING_CONNECTION,
  UPDATE_DRAWING_CONNECTION,
  END_DRAWING_CONNECTION,
  REMOVE_CONNECTION
} from '../constants';

export function selectConnection(layerID, connectionID) {
  return {
    type: SELECT_CONNECTION,
    layerID,
    connectionID
  };
}

export function selectToolDrawingConnection(startItemId) {
  return {
    type: SELECT_TOOL_DRAWING_CONNECTION,
    startItemId
  };
}

export function beginDrawingConnection(layerID, startItemId) {
  return {
    type: BEGIN_DRAWING_CONNECTION,
    layerID,
    startItemId
  };
}

export function updateDrawingConnection(x, y) {
  return {
    type: UPDATE_DRAWING_CONNECTION,
    x, y
  };
}

export function endDrawingConnection(layerID, endItemId) {
  return {
    type: END_DRAWING_CONNECTION,
    layerID,
    endItemId
  };
}

export function removeConnection(layerID, connectionID) {
  return {
    type: REMOVE_CONNECTION,
    layerID,
    connectionID
  };
}
