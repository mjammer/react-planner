var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { Layer } from './export';
import { IDBroker, NameGenerator } from '../utils/export';
import { Map } from 'immutable';
import { Connection as ConnectionModel } from '../models';

import { MODE_IDLE, MODE_DRAWING_CONNECTION } from '../constants';

var Connection = function () {
  function Connection() {
    _classCallCheck(this, Connection);
  }

  _createClass(Connection, null, [{
    key: 'create',
    value: function create(state, layerID, type, startItemId, endItemId, properties) {
      var connectionID = IDBroker.acquireID();

      var connection = new ConnectionModel({
        id: connectionID,
        type: type || 'straight',
        name: NameGenerator.generateName('connections', 'Connection'),
        startItemId: startItemId,
        endItemId: endItemId,
        properties: properties || new Map()
      });

      state = state.setIn(['scene', 'layers', layerID, 'connections', connectionID], connection);

      return { updatedState: state, connection: connection };
    }
  }, {
    key: 'select',
    value: function select(state, layerID, connectionID) {
      state = Layer.select(state, layerID).updatedState;
      state = Layer.selectElement(state, layerID, 'connections', connectionID).updatedState;

      return { updatedState: state };
    }
  }, {
    key: 'unselect',
    value: function unselect(state, layerID, connectionID) {
      state = Layer.unselect(state, layerID, 'connections', connectionID).updatedState;

      return { updatedState: state };
    }
  }, {
    key: 'remove',
    value: function remove(state, layerID, connectionID) {
      state = this.unselect(state, layerID, connectionID).updatedState;
      state = Layer.removeElement(state, layerID, 'connections', connectionID).updatedState;

      return { updatedState: state };
    }
  }, {
    key: 'removeConnectionsByItemId',
    value: function removeConnectionsByItemId(state, layerID, itemID) {
      var _this = this;

      var connections = state.getIn(['scene', 'layers', layerID, 'connections']);
      if (!connections) return { updatedState: state };

      connections.forEach(function (connection) {
        if (connection.startItemId === itemID || connection.endItemId === itemID) {
          state = _this.remove(state, layerID, connection.id).updatedState;
        }
      });

      return { updatedState: state };
    }
  }, {
    key: 'selectToolDrawingConnection',
    value: function selectToolDrawingConnection(state, startItemId) {
      var layerID = state.getIn(['scene', 'selectedLayer']);

      state = state.merge({
        mode: MODE_DRAWING_CONNECTION,
        drawingSupport: new Map({
          layerID: layerID,
          startItemId: startItemId
        })
      });

      return { updatedState: state };
    }
  }, {
    key: 'beginDrawingConnection',
    value: function beginDrawingConnection(state, layerID, startItemId) {
      state = state.merge({
        mode: MODE_DRAWING_CONNECTION,
        drawingSupport: new Map({
          layerID: layerID,
          startItemId: startItemId
        })
      });

      return { updatedState: state };
    }
  }, {
    key: 'updateDrawingConnection',
    value: function updateDrawingConnection(state, x, y) {
      state = state.mergeIn(['drawingSupport'], { currentX: x, currentY: y });

      return { updatedState: state };
    }
  }, {
    key: 'endDrawingConnection',
    value: function endDrawingConnection(state, layerID, endItemId) {
      var startItemId = state.getIn(['drawingSupport', 'startItemId']);

      if (!startItemId || !endItemId || startItemId === endItemId) {
        state = state.merge({
          mode: MODE_IDLE,
          drawingSupport: new Map()
        });
        return { updatedState: state };
      }

      // Check if connection already exists between these two items
      var connections = state.getIn(['scene', 'layers', layerID, 'connections']);
      var existingConnection = connections && connections.find(function (c) {
        return c.startItemId === startItemId && c.endItemId === endItemId || c.startItemId === endItemId && c.endItemId === startItemId;
      });

      if (existingConnection) {
        state = state.merge({
          mode: MODE_IDLE,
          drawingSupport: new Map()
        });
        return { updatedState: state };
      }

      var result = this.create(state, layerID, 'straight', startItemId, endItemId);
      state = result.updatedState;

      state = state.merge({
        mode: MODE_IDLE,
        drawingSupport: new Map()
      });

      return { updatedState: state };
    }
  }, {
    key: 'setProperties',
    value: function setProperties(state, layerID, connectionID, properties) {
      state = state.mergeIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties'], properties);

      return { updatedState: state };
    }
  }, {
    key: 'updateProperties',
    value: function updateProperties(state, layerID, connectionID, properties) {
      properties.forEach(function (v, k) {
        if (state.hasIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties', k])) state = state.mergeIn(['scene', 'layers', layerID, 'connections', connectionID, 'properties', k], v);
      });

      return { updatedState: state };
    }
  }]);

  return Connection;
}();

export { Connection as default };