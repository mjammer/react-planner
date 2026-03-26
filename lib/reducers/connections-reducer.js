'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (state, action) {
  switch (action.type) {
    case _constants.SELECT_CONNECTION:
      return _export.Connection.select(state, action.layerID, action.connectionID).updatedState;

    case _constants.BEGIN_DRAWING_CONNECTION:
      state = state.merge({ sceneHistory: _export2.history.historyPush(state.sceneHistory, state.scene) });
      return _export.Connection.beginDrawingConnection(state, action.layerID, action.startItemId).updatedState;

    case _constants.UPDATE_DRAWING_CONNECTION:
      return _export.Connection.updateDrawingConnection(state, action.x, action.y).updatedState;

    case _constants.END_DRAWING_CONNECTION:
      state = state.merge({ sceneHistory: _export2.history.historyPush(state.sceneHistory, state.scene) });
      return _export.Connection.endDrawingConnection(state, action.layerID, action.endItemId).updatedState;

    case _constants.REMOVE_CONNECTION:
      state = state.merge({ sceneHistory: _export2.history.historyPush(state.sceneHistory, state.scene) });
      return _export.Connection.remove(state, action.layerID, action.connectionID).updatedState;

    default:
      return state;
  }
};

var _export = require('../class/export');

var _export2 = require('../utils/export');

var _constants = require('../constants');