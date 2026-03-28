import { Connection } from '../class/export';
import { history } from '../utils/export';
import { SELECT_CONNECTION, SELECT_TOOL_DRAWING_CONNECTION, BEGIN_DRAWING_CONNECTION, UPDATE_DRAWING_CONNECTION, END_DRAWING_CONNECTION, REMOVE_CONNECTION } from '../constants';

export default function (state, action) {
  switch (action.type) {
    case SELECT_CONNECTION:
      return Connection.select(state, action.layerID, action.connectionID).updatedState;

    case SELECT_TOOL_DRAWING_CONNECTION:
      state = state.merge({ sceneHistory: history.historyPush(state.sceneHistory, state.scene) });
      return Connection.selectToolDrawingConnection(state, action.startItemId).updatedState;

    case BEGIN_DRAWING_CONNECTION:
      return Connection.beginDrawingConnection(state, action.layerID, action.startItemId).updatedState;

    case UPDATE_DRAWING_CONNECTION:
      return Connection.updateDrawingConnection(state, action.x, action.y).updatedState;

    case END_DRAWING_CONNECTION:
      state = state.merge({ sceneHistory: history.historyPush(state.sceneHistory, state.scene) });
      return Connection.endDrawingConnection(state, action.layerID, action.endItemId).updatedState;

    case REMOVE_CONNECTION:
      state = state.merge({ sceneHistory: history.historyPush(state.sceneHistory, state.scene) });
      return Connection.remove(state, action.layerID, action.connectionID).updatedState;

    default:
      return state;
  }
}