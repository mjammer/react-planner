import { IDBroker } from '../utils/export';
import { Connection as ConnectionModel } from '../models';
import { Map } from 'immutable';
import {
  MODE_IDLE,
  MODE_DRAWING_CONNECTION
} from '../constants';

class Connection {

  static create(state, layerID, startItemId, endItemId) {
    let connectionID = IDBroker.acquireID();
    let connection = new ConnectionModel({
      id: connectionID,
      type: 'straight',
      startItemId,
      endItemId
    });

    state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID], connection);

    return { updatedState: state, connection };
  }

  static select(state, layerID, connectionID) {
    state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID, 'selected'], true);
    state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], list => list.push(connectionID));

    return { updatedState: state };
  }

  static unselect(state, layerID, connectionID) {
    state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID, 'selected'], false);
    state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], list => list.filter(id => id !== connectionID));

    return { updatedState: state };
  }

  static remove(state, layerID, connectionID) {
    state = state.deleteIn(['scene', 'layers', layerID, 'connections', connectionID]);
    state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], list => list.filter(id => id !== connectionID));

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
    state = state.setIn(['drawingSupport', 'currentX'], x);
    state = state.setIn(['drawingSupport', 'currentY'], y);

    return { updatedState: state };
  }

  static endDrawingConnection(state, layerID, endItemId) {
    let startItemId = state.getIn(['drawingSupport', 'startItemId']);
    let drawingLayerID = state.getIn(['drawingSupport', 'layerID']) || layerID;

    const resetToIdle = () => state.merge({
      mode: MODE_IDLE,
      drawingSupport: new Map()
    });

    // Cancel if no start item or target was not specified (user clicked empty space)
    if (!startItemId || !endItemId) {
      state = resetToIdle();
      return { updatedState: state };
    }

    // Prevent self-connection
    if (startItemId === endItemId) {
      state = resetToIdle();
      return { updatedState: state };
    }

    let { updatedState } = Connection.create(state, drawingLayerID, startItemId, endItemId);
    state = updatedState;

    state = resetToIdle();

    return { updatedState: state };
  }
}

export { Connection as default };
