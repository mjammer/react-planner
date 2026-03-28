import { Layer } from './export';
import {
  IDBroker,
  NameGenerator
} from '../utils/export';
import { Map } from 'immutable';
import { Connection as ConnectionModel } from '../models';

import {
  MODE_IDLE,
  MODE_DRAWING_CONNECTION
} from '../constants';

class Connection {

  static create(state, layerID, type, startItemId, endItemId, properties) {
    let connectionID = IDBroker.acquireID();

    let connection = new ConnectionModel({
      id: connectionID,
      type: type || 'straight',
      name: NameGenerator.generateName('connections', 'Connection'),
      startItemId,
      endItemId,
      properties: properties || new Map()
    });

    state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID], connection);

    return { updatedState: state, connection };
  }

  static select(state, layerID, connectionID) {
    state = Layer.select(state, layerID).updatedState;
    state = Layer.selectElement(state, layerID, 'connections', connectionID).updatedState;

    return { updatedState: state };
  }

  static unselect(state, layerID, connectionID) {
    state = Layer.unselect(state, layerID, 'connections', connectionID).updatedState;

    return { updatedState: state };
  }

  static remove(state, layerID, connectionID) {
    state = this.unselect(state, layerID, connectionID).updatedState;
    state = Layer.removeElement(state, layerID, 'connections', connectionID).updatedState;

    return { updatedState: state };
  }

  static removeConnectionsByItemId(state, layerID, itemID) {
    let connections = state.getIn(['scene', 'layers', layerID, 'connections']);
    if (!connections) return { updatedState: state };

    connections.forEach(connection => {
      if (connection.startItemId === itemID || connection.endItemId === itemID) {
        state = this.remove(state, layerID, connection.id).updatedState;
      }
    });

    return { updatedState: state };
  }

  static selectToolDrawingConnection(state, startItemId) {
    let layerID = state.getIn(['scene', 'selectedLayer']);

    state = state.merge({
      mode: MODE_DRAWING_CONNECTION,
      drawingSupport: new Map({
        layerID,
        startItemId
      })
    });

    return { updatedState: state };
  }

  static beginDrawingConnection(state, layerID, startItemId) {
    state = state.merge({
      mode: MODE_DRAWING_CONNECTION,
      drawingSupport: new Map({
        layerID,
        startItemId
      })
    });

    return { updatedState: state };
  }

  static updateDrawingConnection(state, x, y) {
    state = state.mergeIn(['drawingSupport'], { currentX: x, currentY: y });

    return { updatedState: state };
  }

  static endDrawingConnection(state, layerID, endItemId) {
    let startItemId = state.getIn(['drawingSupport', 'startItemId']);

    if (!startItemId || !endItemId || startItemId === endItemId) {
      state = state.merge({
        mode: MODE_IDLE,
        drawingSupport: new Map()
      });
      return { updatedState: state };
    }

    // Check if connection already exists between these two items
    let connections = state.getIn(['scene', 'layers', layerID, 'connections']);
    let existingConnection = connections && connections.find(c =>
      (c.startItemId === startItemId && c.endItemId === endItemId) ||
      (c.startItemId === endItemId && c.endItemId === startItemId)
    );

    if (existingConnection) {
      state = state.merge({
        mode: MODE_IDLE,
        drawingSupport: new Map()
      });
      return { updatedState: state };
    }

    let result = this.create(state, layerID, 'straight', startItemId, endItemId);
    state = result.updatedState;

    state = state.merge({
      mode: MODE_IDLE,
      drawingSupport: new Map()
    });

    return { updatedState: state };
  }

  static setProperties(state, layerID, connectionID, properties) {
    state = state.mergeIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties'], properties);

    return { updatedState: state };
  }

  static updateProperties(state, layerID, connectionID, properties) {
    properties.forEach((v, k) => {
      if (state.hasIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties', k]))
        state = state.mergeIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties', k], v);
    });

    return { updatedState: state };
  }
}

export { Connection as default };
