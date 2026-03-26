'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _export = require('../utils/export');

var _models = require('../models');

var _immutable = require('immutable');

var _constants = require('../constants');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connection = function () {
  function Connection() {
    _classCallCheck(this, Connection);
  }

  _createClass(Connection, null, [{
    key: 'create',
    value: function create(state, layerID, startItemId, endItemId) {
      var connectionID = _export.IDBroker.acquireID();
      var connection = new _models.Connection({
        id: connectionID,
        type: 'straight',
        startItemId: startItemId,
        endItemId: endItemId
      });

      state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID], connection);

      return { updatedState: state, connection: connection };
    }
  }, {
    key: 'select',
    value: function select(state, layerID, connectionID) {
      state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID, 'selected'], true);
      state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], function (list) {
        return list.push(connectionID);
      });

      return { updatedState: state };
    }
  }, {
    key: 'unselect',
    value: function unselect(state, layerID, connectionID) {
      state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID, 'selected'], false);
      state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], function (list) {
        return list.filter(function (id) {
          return id !== connectionID;
        });
      });

      return { updatedState: state };
    }
  }, {
    key: 'remove',
    value: function remove(state, layerID, connectionID) {
      state = state.deleteIn(['scene', 'layers', layerID, 'connections', connectionID]);
      state = state.updateIn(['scene', 'layers', layerID, 'selected', 'connections'], function (list) {
        return list.filter(function (id) {
          return id !== connectionID;
        });
      });

      return { updatedState: state };
    }
  }, {
    key: 'beginDrawingConnection',
    value: function beginDrawingConnection(state, layerID, startItemId) {
      state = state.merge({
        mode: _constants.MODE_DRAWING_CONNECTION,
        drawingSupport: new _immutable.Map({
          layerID: layerID,
          startItemId: startItemId
        })
      });

      return { updatedState: state };
    }
  }, {
    key: 'updateDrawingConnection',
    value: function updateDrawingConnection(state, x, y) {
      state = state.setIn(['drawingSupport', 'currentX'], x);
      state = state.setIn(['drawingSupport', 'currentY'], y);

      return { updatedState: state };
    }
  }, {
    key: 'endDrawingConnection',
    value: function endDrawingConnection(state, layerID, endItemId) {
      var startItemId = state.getIn(['drawingSupport', 'startItemId']);
      var drawingLayerID = state.getIn(['drawingSupport', 'layerID']) || layerID;

      var resetToIdle = function resetToIdle() {
        return state.merge({
          mode: _constants.MODE_IDLE,
          drawingSupport: new _immutable.Map()
        });
      };

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

      var _Connection$create = Connection.create(state, drawingLayerID, startItemId, endItemId),
          updatedState = _Connection$create.updatedState;

      state = updatedState;

      state = resetToIdle();

      return { updatedState: state };
    }
  }]);

  return Connection;
}();

exports.default = Connection;