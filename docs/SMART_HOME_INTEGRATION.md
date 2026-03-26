# 智能家居全屋智能 × React-Planner 技术对接方案

> 基于 react-planner v2.0.6 的全屋智能可视化平台技术方案
> 文档日期：2026-03-25

---

## 目录

1. [方案概述](#1-方案概述)
2. [react-planner 核心架构速览](#2-react-planner-核心架构速览)
3. [整体集成架构设计](#3-整体集成架构设计)
4. [智能设备 Catalog 设计](#4-智能设备-catalog-设计)
5. [设备数据模型扩展](#5-设备数据模型扩展)
6. [IoT 实时状态插件](#6-iot-实时状态插件)
7. [2D/3D 设备渲染方案](#7-2d3d-设备渲染方案)
8. [设备属性面板扩展](#8-设备属性面板扩展)
9. [区域联动与自动化规则](#9-区域联动与自动化规则)
10. [后端 API 对接规范](#10-后端-api-对接规范)
11. [Redux 状态扩展方案](#11-redux-状态扩展方案)
12. [前端工程集成步骤](#12-前端工程集成步骤)
13. [安全与权限设计](#13-安全与权限设计)
14. [性能优化建议](#14-性能优化建议)
15. [附录：关键文件索引](#15-附录关键文件索引)

---

## 1. 方案概述

### 1.1 目标

以 `react-planner` 作为可视化底层引擎，构建一套**全屋智能设备管理平台**，实现：

- 在 2D 户型图上**拖拽放置**智能设备（灯、开关、传感器、摄像头、窗帘、空调等）
- 设备与房间区域绑定，支持**区域联动控制**
- 通过 MQTT / WebSocket 接收设备**实时状态**并同步到 UI
- 支持**场景编排**（一键回家、离家模式等）
- 提供 2D 平面图 + 3D 沉浸视角的**双模态查看**
- 持久化户型数据与设备配置，与后端平台**双向同步**

### 1.2 技术栈选型

| 层次 | 技术选型 |
|------|----------|
| 平面图引擎 | react-planner v2.0.6 |
| 状态管理 | Redux + Immutable.js（沿用 planner 体系） |
| 实时通信 | MQTT over WebSocket（推荐 EMQX）或 Socket.IO |
| 3D 渲染 | Three.js（planner 内置） |
| 设备协议抽象 | 自定义 DeviceAdapter 层 |
| UI 组件库 | 按需引入（Ant Design / shadcn/ui） |
| 本地持久化 | localStorage（自动保存）+ 后端 REST API |

---

## 2. react-planner 核心架构速览

### 2.1 状态树结构

```
AppState (Immutable Map)
└── react-planner (State Record)
    ├── mode            // 当前交互模式
    ├── scene           // 户型数据（核心）
    │   ├── unit        // 单位：cm/m/in
    │   ├── layers      // 楼层/分层
    │   │   └── [layerID]
    │   │       ├── vertices  // 顶点坐标
    │   │       ├── lines     // 墙体
    │   │       ├── holes     // 门窗（墙上的洞口）
    │   │       ├── areas     // 自动识别的封闭区域（房间）
    │   │       └── items     // 独立物体（设备放置于此）
    │   ├── grids       // 网格配置
    │   └── guides      // 辅助线
    ├── catalog         // 元素目录（设备库）
    ├── sceneHistory    // 撤销/重做栈
    ├── viewer2D        // 2D 视口状态
    └── snapMask        // 吸附配置
```

**智能设备将以 `Item` 类型挂载在 `layers.[id].items` 下。**

### 2.2 关键扩展接口

```
react-planner 提供以下原生扩展点：
┌────────────────────────────────────────────────────┐
│  ReactPlanner Props                                │
│  ├── catalog          ← 注册自定义设备元素          │
│  ├── plugins          ← 注入 IoT 实时插件           │
│  ├── toolbarButtons   ← 自定义工具栏按钮             │
│  ├── sidebarComponents← 自定义侧边栏面板             │
│  ├── footerbarComponents← 自定义底栏组件             │
│  └── stateExtractor   ← 状态选择器                  │
└────────────────────────────────────────────────────┘
```

### 2.3 元素生命周期

```
用户操作 → Action Creator → Reducer → Immutable State → Re-render
            (dispatch)     (路由到对应子reducer)
```

---

## 3. 整体集成架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                       前端应用 (React)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Redux Store (Immutable)                     │   │
│  │   ┌────────────────┐   ┌──────────────────────────────┐  │   │
│  │   │  react-planner │   │  smart-home (自定义 slice)   │  │   │
│  │   │  State         │   │  ├── deviceStatuses (实时态) │  │   │
│  │   │  (户型/设备布局)│   │  ├── scenes (自动化场景)    │  │   │
│  │   │                │   │  ├── rooms (区域属性)        │  │   │
│  │   │                │   │  └── alerts (告警队列)       │  │   │
│  │   └────────────────┘   └──────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │  ReactPlanner │  │  设备控制面板 │  │  场景管理面板      │    │
│  │  (平面图编辑) │  │  (自定义侧栏)│  │  (自定义侧栏)     │    │
│  └───────────────┘  └──────────────┘  └───────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  IoT Plugin Layer                                       │    │
│  │  ├── MqttPlugin         (MQTT over WS 订阅/发布)        │    │
│  │  ├── DeviceSyncPlugin   (设备状态 → Redux)              │    │
│  │  └── SceneTriggerPlugin (自动化规则执行)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           ↕ REST API          ↕ MQTT / WebSocket
┌──────────────────────────────────────────────────────────────────┐
│                      后端平台                                     │
│   ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│   │  户型存储服务  │  │  设备管理服务 │  │  自动化规则引擎     │   │
│   └───────────────┘  └──────────────┘  └────────────────────┘   │
│   ┌───────────────┐  ┌──────────────┐                           │
│   │  MQTT Broker  │  │  设备影子服务 │                           │
│   └───────────────┘  └──────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
           ↕ Zigbee / Z-Wave / Wi-Fi / Matter
┌──────────────────────────────────────────────────────────────────┐
│                     物理设备层                                    │
│   灯泡  开关  传感器  摄像头  门锁  空调  窗帘  插座  网关...    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 智能设备 Catalog 设计

### 4.1 设备分类体系

```javascript
// src/smart-home/catalog/smart-catalog.js
import { Catalog } from 'react-planner';

// 设备类别定义
const DEVICE_CATEGORIES = {
  LIGHTING:    { id: 'lighting',    label: '照明设备' },
  SECURITY:    { id: 'security',    label: '安防设备' },
  HVAC:        { id: 'hvac',        label: '暖通空调' },
  SENSOR:      { id: 'sensor',      label: '传感器'   },
  SHADING:     { id: 'shading',     label: '遮阳系统' },
  SOCKET:      { id: 'socket',      label: '智能插座' },
  GATEWAY:     { id: 'gateway',     label: '网关'     },
  MULTIMEDIA:  { id: 'multimedia',  label: '多媒体'   },
};

let SmartHomeCatalog = new Catalog();

// 注册设备元素（见 4.2 具体示例）
SmartHomeCatalog.registerMultipleElements([
  SmartLight,
  SmartSwitch,
  SmartCamera,
  SmartThermostat,
  MotionSensor,
  DoorLock,
  SmartCurtain,
  SmartSocket,
  SmokeDetector,
  Gateway,
]);

// 按类别注册
SmartHomeCatalog.registerCategory('lighting', '照明设备',
  [SmartLight, SmartSwitch]);
SmartHomeCatalog.registerCategory('security', '安防设备',
  [SmartCamera, DoorLock, SmokeDetector]);
SmartHomeCatalog.registerCategory('hvac', '暖通空调',
  [SmartThermostat, AirConditioner]);
SmartHomeCatalog.registerCategory('sensor', '传感器',
  [MotionSensor, TemperatureSensor, HumiditySensor]);

export default SmartHomeCatalog;
```

### 4.2 设备元素结构规范

以**智能灯泡**为例，展示完整元素定义：

```javascript
// src/smart-home/catalog/items/smart-light/index.js
import React from 'react';
import * as Three from 'three';
import { buildElementPath } from '../../utils/element-utils';

export default {
  name: 'smart-light',       // 全局唯一标识（对应设备类型）
  prototype: 'items',        // 挂载到 items 节点

  info: {
    title: '智能灯泡',
    tag: ['lighting', 'smart'],
    description: 'Wi-Fi/Zigbee 智能灯泡，支持调光调色',
    image: require('./smart-light.png'),
  },

  // ─── 设备属性定义 ───────────────────────────────────────────────
  properties: {
    // 物理尺寸
    width:  { label: '宽度', type: 'length-measure', defaultValue: { length: 15, unit: 'cm' } },
    depth:  { label: '深度', type: 'length-measure', defaultValue: { length: 15, unit: 'cm' } },
    height: { label: '高度', type: 'length-measure', defaultValue: { length: 15, unit: 'cm' } },

    // 设备绑定
    deviceId:   { label: '设备ID',   type: 'string',  defaultValue: '' },
    deviceName: { label: '设备名称', type: 'string',  defaultValue: '智能灯泡' },
    roomId:     { label: '所属房间', type: 'string',  defaultValue: '' },
    protocol:   { label: '通信协议', type: 'enum',
      defaultValue: 'zigbee',
      values: { zigbee: 'Zigbee', wifi: 'Wi-Fi', zwave: 'Z-Wave', matter: 'Matter' }
    },

    // 实时状态（由 IoT Plugin 写入，UI 只读）
    online:      { label: '在线状态', type: 'toggle',  defaultValue: false },
    power:       { label: '开关',     type: 'toggle',  defaultValue: false },
    brightness:  { label: '亮度(%)',  type: 'number',  defaultValue: 100 },
    colorTemp:   { label: '色温(K)',  type: 'number',  defaultValue: 4000 },
    color:       { label: '颜色',     type: 'color',   defaultValue: '#FFFFFF' },

    // 外观
    mountType:   { label: '安装方式', type: 'enum',
      defaultValue: 'ceiling',
      values: { ceiling: '吸顶', hanging: '吊灯', wall: '壁灯', floor: '落地' }
    },
  },

  // ─── 2D 渲染（SVG）────────────────────────────────────────────────
  render2D(element, layer, scene) {
    const { x, y } = element;
    const online    = element.getIn(['properties', 'online']);
    const power     = element.getIn(['properties', 'power']);
    const color     = element.getIn(['properties', 'color']) || '#FFFFFF';

    const iconColor  = online ? (power ? color : '#999999') : '#CCCCCC';
    const glowColor  = power ? color : 'none';
    const strokeColor = element.get('selected') ? '#0066FF' : '#333333';

    return (
      <g transform={`translate(-12, -12)`}>
        {/* 光晕效果（开灯时显示） */}
        {power && (
          <circle cx="12" cy="12" r="18" fill={glowColor} opacity="0.2" />
        )}
        {/* 灯泡主体 */}
        <circle cx="12" cy="12" r="10"
          fill={iconColor}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        {/* 灯泡图标 */}
        <text x="12" y="16" textAnchor="middle"
          fontSize="12" fill={power ? '#333' : '#999'}>
          💡
        </text>
        {/* 离线指示 */}
        {!online && (
          <line x1="4" y1="4" x2="20" y2="20"
            stroke="#FF0000" strokeWidth="2" />
        )}
      </g>
    );
  },

  // ─── 3D 渲染（Three.js）──────────────────────────────────────────
  render3D(element, layer, scene) {
    return new Promise((resolve) => {
      const group = new Three.Group();
      const power = element.getIn(['properties', 'power']);
      const color = element.getIn(['properties', 'color']) || '#FFFFFF';

      // 灯泡几何体
      const bulbGeo  = new Three.SphereGeometry(8, 16, 16);
      const bulbMat  = new Three.MeshStandardMaterial({
        color: power ? new Three.Color(color) : 0x888888,
        emissive: power ? new Three.Color(color) : 0x000000,
        emissiveIntensity: power ? 0.8 : 0,
        transparent: true,
        opacity: 0.9,
      });
      const bulbMesh = new Three.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.set(0, 15, 0);

      // 灯座
      const baseGeo  = new Three.CylinderGeometry(3, 5, 8, 8);
      const baseMat  = new Three.MeshStandardMaterial({ color: 0xAAAAAA });
      const baseMesh = new Three.Mesh(baseGeo, baseMat);
      baseMesh.position.set(0, 22, 0);

      // 点光源（开灯时）
      if (power) {
        const light = new Three.PointLight(
          new Three.Color(color), 1.5, 200
        );
        light.position.set(0, 15, 0);
        group.add(light);
      }

      group.add(bulbMesh, baseMesh);
      resolve(group);
    });
  },
};
```

### 4.3 设备类型速查表

| 设备类型 | name | prototype | 核心属性 |
|---------|------|-----------|---------|
| 智能灯泡 | `smart-light` | items | power, brightness, colorTemp, color |
| 智能开关 | `smart-switch` | holes (墙面) | power, channels, bindDevices |
| 智能摄像头 | `smart-camera` | items | online, recording, angle, resolution |
| 智能温控器 | `smart-thermostat` | items | targetTemp, currentTemp, mode, power |
| 门窗传感器 | `door-sensor` | holes | state(open/closed), battery |
| 人体传感器 | `motion-sensor` | items | detected, sensitivity, delay |
| 烟雾报警器 | `smoke-detector` | items | alarm, battery, online |
| 智能门锁 | `smart-lock` | holes | locked, battery, accessLog |
| 智能窗帘 | `smart-curtain` | holes | position(0-100), mode |
| 网关 | `gateway` | items | online, subDevices, protocol |
| 智能插座 | `smart-socket` | items | power, powerUsage, voltage |
| 空调 | `air-conditioner` | items | power, mode, temp, fanSpeed |

---

## 5. 设备数据模型扩展

### 5.1 Item 属性约定

react-planner 的 `Item` Record 在 `properties` Map 中存储设备属性。
约定所有智能设备遵循以下**属性命名空间**：

```
properties
├── [物理属性]    width / depth / height  (planner 标准)
├── [绑定属性]    deviceId / deviceName / roomId / protocol
├── [实时状态]    online / power / [设备特有状态字段]
└── [配置属性]    [设备特有配置字段]
```

### 5.2 设备状态更新 Action 设计

```javascript
// src/smart-home/actions/device-actions.js

export const DEVICE_STATUS_UPDATE = 'SMART_HOME/DEVICE_STATUS_UPDATE';
export const DEVICE_BIND          = 'SMART_HOME/DEVICE_BIND';
export const DEVICE_CONTROL       = 'SMART_HOME/DEVICE_CONTROL';
export const DEVICE_ALERT         = 'SMART_HOME/DEVICE_ALERT';

/**
 * 批量更新设备实时状态到 planner items properties
 * @param {string} layerId
 * @param {string} itemId       planner item id
 * @param {Object} statusPatch  需更新的属性键值对
 */
export function updateDeviceStatus(layerId, itemId, statusPatch) {
  return {
    type: DEVICE_STATUS_UPDATE,
    layerId,
    itemId,
    statusPatch,  // e.g. { power: true, brightness: 80 }
  };
}

/**
 * 将物理设备绑定到平面图上的 item
 * @param {string} layerId
 * @param {string} itemId
 * @param {Object} deviceInfo   { deviceId, deviceName, protocol, ... }
 */
export function bindDevice(layerId, itemId, deviceInfo) {
  return {
    type: DEVICE_BIND,
    layerId,
    itemId,
    deviceInfo,
  };
}

/**
 * 向设备发送控制指令（同时乐观更新本地状态）
 */
export function controlDevice(layerId, itemId, command) {
  return {
    type: DEVICE_CONTROL,
    layerId,
    itemId,
    command,  // e.g. { action: 'set_brightness', value: 50 }
  };
}
```

### 5.3 Reducer 扩展

```javascript
// src/smart-home/reducers/smart-home-reducer.js
import { DEVICE_STATUS_UPDATE, DEVICE_BIND } from '../actions/device-actions';

// 挂载在 react-planner reducer 之外，处理 smart-home slice
export function smartHomeReducer(plannerState, action) {
  switch (action.type) {

    case DEVICE_STATUS_UPDATE: {
      const { layerId, itemId, statusPatch } = action;
      return Object.entries(statusPatch).reduce(
        (state, [key, value]) =>
          state.setIn(
            ['scene', 'layers', layerId, 'items', itemId, 'properties', key],
            value
          ),
        plannerState
      );
    }

    case DEVICE_BIND: {
      const { layerId, itemId, deviceInfo } = action;
      let state = plannerState;
      Object.entries(deviceInfo).forEach(([key, value]) => {
        state = state.setIn(
          ['scene', 'layers', layerId, 'items', itemId, 'properties', key],
          value
        );
      });
      return state;
    }

    default:
      return plannerState;
  }
}

// 组合到主 reducer
// src/store/reducer.js
let reducer = (state, action) => {
  state = state || AppState;
  // 先走 planner 标准 reducer
  state = state.update('react-planner',
    plannerState => PlannerReducer(plannerState, action));
  // 再走智能家居扩展 reducer
  state = state.update('react-planner',
    plannerState => smartHomeReducer(plannerState, action));
  // smart-home 独立 slice（场景、告警等）
  state = state.update('smart-home',
    shState => smartHomeSliceReducer(shState, action));
  return state;
};
```

---

## 6. IoT 实时状态插件

### 6.1 MQTT 插件

```javascript
// src/smart-home/plugins/mqtt-plugin.js
import mqtt from 'mqtt';
import { updateDeviceStatus, addAlert } from '../actions/device-actions';

/**
 * MqttPlugin - 连接 MQTT Broker，订阅设备主题，推送状态到 Redux
 *
 * Topic 约定：
 *   上报（设备→平台）: home/{homeId}/device/{deviceId}/status
 *   控制（平台→设备）: home/{homeId}/device/{deviceId}/control
 *   告警:             home/{homeId}/device/{deviceId}/alert
 */
export default function MqttPlugin(options = {}) {
  const {
    brokerUrl  = 'wss://your-broker:8084/mqtt',
    homeId     = 'home001',
    username,
    password,
  } = options;

  return (store, stateExtractor) => {
    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      reconnectPeriod: 3000,
      keepalive: 60,
    });

    // 订阅所有设备状态主题
    client.on('connect', () => {
      console.log('[MqttPlugin] Connected to broker');
      client.subscribe(`home/${homeId}/device/+/status`);
      client.subscribe(`home/${homeId}/device/+/alert`);
    });

    client.on('message', (topic, payload) => {
      const topicParts = topic.split('/');
      const deviceId   = topicParts[3];
      const msgType    = topicParts[4];
      let message;

      try { message = JSON.parse(payload.toString()); }
      catch (e) { return; }

      if (msgType === 'status') {
        // 在 planner state 中查找对应 item
        const plannerState = stateExtractor(store.getState());
        const location = findItemByDeviceId(plannerState, deviceId);

        if (location) {
          store.dispatch(updateDeviceStatus(
            location.layerId,
            location.itemId,
            message   // { power: true, brightness: 80, ... }
          ));
        }
      }

      if (msgType === 'alert') {
        store.dispatch(addAlert({ deviceId, ...message }));
      }
    });

    // 暴露 publish 方法到 window 供调试
    if (process.env.NODE_ENV === 'development') {
      window.__mqttClient = client;
    }

    // 返回 client 以便外部控制
    store._mqttClient = client;
  };
}

/**
 * 在 planner state 中根据 deviceId 找到 item 位置
 */
function findItemByDeviceId(plannerState, deviceId) {
  const layers = plannerState.getIn(['scene', 'layers']);
  for (const [layerId, layer] of layers.entries()) {
    for (const [itemId, item] of layer.get('items').entries()) {
      if (item.getIn(['properties', 'deviceId']) === deviceId) {
        return { layerId, itemId };
      }
    }
  }
  return null;
}
```

### 6.2 设备控制方法

```javascript
// src/smart-home/services/device-control.js

/**
 * 向设备发送控制指令
 * @param {Object} mqttClient  从 store._mqttClient 获取
 * @param {string} homeId
 * @param {string} deviceId
 * @param {Object} command     { action, value }
 */
export function sendCommand(mqttClient, homeId, deviceId, command) {
  const topic   = `home/${homeId}/device/${deviceId}/control`;
  const payload = JSON.stringify({
    ...command,
    timestamp: Date.now(),
    requestId: generateRequestId(),
  });
  mqttClient.publish(topic, payload, { qos: 1 });
}

// 典型指令示例
export const Commands = {
  // 灯光
  lightOn:        () => ({ action: 'set_power', value: true }),
  lightOff:       () => ({ action: 'set_power', value: false }),
  setBrightness:  (v) => ({ action: 'set_brightness', value: v }),
  setColorTemp:   (k) => ({ action: 'set_color_temp', value: k }),
  setColor:       (hex) => ({ action: 'set_color', value: hex }),

  // 空调
  acOn:           () => ({ action: 'set_power', value: true }),
  setTemp:        (t) => ({ action: 'set_temperature', value: t }),
  setMode:        (m) => ({ action: 'set_mode', value: m }), // cool/heat/fan/auto
  setFanSpeed:    (s) => ({ action: 'set_fan_speed', value: s }),

  // 窗帘
  curtainOpen:    () => ({ action: 'set_position', value: 100 }),
  curtainClose:   () => ({ action: 'set_position', value: 0 }),
  curtainSetPos:  (p) => ({ action: 'set_position', value: p }),

  // 门锁
  lockDoor:       () => ({ action: 'lock' }),
  unlockDoor:     () => ({ action: 'unlock' }),
};
```

### 6.3 自动保存插件（扩展版）

```javascript
// src/smart-home/plugins/sync-plugin.js
import { saveFloorPlan, loadFloorPlan } from '../api/floor-plan-api';
import { debounce } from 'lodash';

/**
 * 将户型数据双向同步到后端，同时保留 localStorage 作为缓存
 */
export default function SyncPlugin(options = {}) {
  const {
    homeId,
    saveDelay  = 2000,   // 防抖延迟 ms
    localKey   = `react-planner_${homeId}`,
  } = options;

  return (store, stateExtractor) => {
    // 启动时从后端加载，降级到 localStorage
    loadFloorPlan(homeId)
      .then(data => {
        if (data) {
          store.dispatch({ type: 'LOAD_PROJECT', sceneJSON: data });
        } else {
          const local = localStorage.getItem(localKey);
          if (local) {
            store.dispatch({ type: 'LOAD_PROJECT', sceneJSON: JSON.parse(local) });
          }
        }
      })
      .catch(() => {
        const local = localStorage.getItem(localKey);
        if (local) {
          store.dispatch({ type: 'LOAD_PROJECT', sceneJSON: JSON.parse(local) });
        }
      });

    // 状态变化时防抖保存
    const debouncedSave = debounce(() => {
      const state    = stateExtractor(store.getState());
      const sceneJS  = state.get('scene').toJS();

      // 本地缓存
      localStorage.setItem(localKey, JSON.stringify(sceneJS));

      // 远程保存
      saveFloorPlan(homeId, sceneJS).catch(console.error);
    }, saveDelay);

    store.subscribe(debouncedSave);
  };
}
```

---

## 7. 2D/3D 设备渲染方案

### 7.1 2D 渲染规范

**设备在 SVG 画布中的坐标系：**
- react-planner 使用厘米为内部单位
- `item.x` / `item.y` 为设备中心点坐标
- `element.rotation` 为旋转角度（度）
- planner 自动在 `<g transform="...">` 外层处理位移和旋转

**2D 渲染约定：**
```
render2D 返回的 JSX 以设备中心 (0,0) 为原点，
尺寸单位为 SVG 用户单位（对应 cm）
```

**设备状态视觉映射：**

| 状态 | 视觉表现 |
|------|---------|
| 离线 | 灰色 + 红色斜线 |
| 在线待机 | 正常颜色 |
| 运行中 | 高亮 + 发光效果 |
| 告警 | 红色闪烁边框 |
| 被选中 | 蓝色描边 |

```javascript
// 通用设备状态样式 helper
export function getDeviceStyle(element) {
  const online  = element.getIn(['properties', 'online']);
  const power   = element.getIn(['properties', 'power']);
  const alarm   = element.getIn(['properties', 'alarm']);
  const selected = element.get('selected');

  return {
    opacity:     online ? 1 : 0.4,
    stroke:      selected ? '#0066FF' : alarm ? '#FF0000' : '#444444',
    strokeWidth: selected ? 2 : 1,
    fill:        power ? '#FFD700' : '#AAAAAA',
  };
}
```

### 7.2 3D 渲染规范

**坐标系：**
- Three.js 场景中 Y 轴朝上
- planner 将 2D 平面映射到 XZ 平面（Y=0 为地面）
- 设备高度由 `mountType` 属性决定：
  - `ceiling`: Y ≈ 楼层高度（默认 270 cm）
  - `wall`: Y ≈ 100~200 cm
  - `floor`: Y = 0~50 cm

**LOD 建议：**
- 近距离（< 200 cm）：详细模型
- 中距离（200~800 cm）：简化几何体
- 远距离（> 800 cm）：点精灵（Sprite）

```javascript
// 通用 3D 设备基础构建器
export function buildDeviceBase3D(element, options = {}) {
  const {
    geometry  = new Three.BoxGeometry(10, 10, 10),
    colorOn   = 0xFFD700,
    colorOff  = 0x888888,
  } = options;

  const power = element.getIn(['properties', 'power']);
  const mat = new Three.MeshStandardMaterial({
    color: power ? colorOn : colorOff,
    emissive: power ? colorOn : 0x000000,
    emissiveIntensity: power ? 0.4 : 0,
  });

  const mesh = new Three.Mesh(geometry, mat);

  // 选中状态：外框线
  if (element.get('selected')) {
    const edges = new Three.EdgesGeometry(geometry);
    const lineMat = new Three.LineBasicMaterial({ color: 0x0066FF, linewidth: 2 });
    mesh.add(new Three.LineSegments(edges, lineMat));
  }

  return mesh;
}
```

### 7.3 设备图标资源规范

```
src/smart-home/catalog/items/[device-name]/
├── index.js          设备定义
├── icon.svg          2D 图标（24×24 SVG）
├── thumbnail.png     目录缩略图（64×64 PNG）
└── model/
    ├── low.glb       低精度 3D 模型
    └── high.glb      高精度 3D 模型（可选）
```

---

## 8. 设备属性面板扩展

### 8.1 自定义侧边栏面板

```javascript
// src/smart-home/components/device-control-panel.jsx
import React, { useContext } from 'react';
import { ReactPlannerContext } from 'react-planner';

export default function DeviceControlPanel({ state }) {
  // 获取当前选中的 item
  const selectedLayer = state.getIn(['scene', 'selectedLayer']);
  const selectedItems = state.getIn(
    ['scene', 'layers', selectedLayer, 'selected', 'items']
  );

  if (!selectedItems || selectedItems.size === 0) {
    return <div className="panel">请选择一个设备</div>;
  }

  const itemId = selectedItems.first();
  const item   = state.getIn(
    ['scene', 'layers', selectedLayer, 'items', itemId]
  );
  const props  = item.get('properties');

  return (
    <div className="device-control-panel">
      <h3>{props.get('deviceName') || item.get('type')}</h3>
      <div className="status-badge">
        {props.get('online') ? '在线' : '离线'}
      </div>

      {/* 开关控制 */}
      <div className="control-row">
        <label>电源</label>
        <Toggle
          value={props.get('power')}
          onChange={(v) => dispatchControl(item, { action: 'set_power', value: v })}
        />
      </div>

      {/* 亮度滑块（灯光类设备） */}
      {item.get('type') === 'smart-light' && (
        <div className="control-row">
          <label>亮度</label>
          <Slider
            value={props.get('brightness')}
            min={1} max={100}
            onChange={(v) => dispatchControl(item, { action: 'set_brightness', value: v })}
          />
        </div>
      )}

      {/* 温度设置（空调/温控） */}
      {['smart-thermostat', 'air-conditioner'].includes(item.get('type')) && (
        <div className="control-row">
          <label>目标温度</label>
          <NumberInput
            value={props.get('targetTemp')}
            min={16} max={30} step={0.5}
            unit="°C"
            onChange={(v) => dispatchControl(item, { action: 'set_temperature', value: v })}
          />
        </div>
      )}
    </div>
  );
}
```

### 8.2 注册到 ReactPlanner

```jsx
<ReactPlanner
  catalog={SmartHomeCatalog}
  width={width}
  height={height}
  plugins={plugins}
  stateExtractor={state => state.get('react-planner')}
  sidebarComponents={[
    DeviceControlPanel,   // 设备控制面板
    RoomInfoPanel,        // 房间信息面板
    SceneManagerPanel,    // 场景管理面板
  ]}
  toolbarButtons={[
    DeviceBindButton,     // 设备绑定工具
    SceneTriggerButton,   // 场景触发按钮
    AlertViewButton,      // 告警查看按钮
  ]}
/>
```

---

## 9. 区域联动与自动化规则

### 9.1 房间识别与绑定

react-planner 通过 `GraphInnerCycles` 算法自动检测封闭区域（`Area`）。
每个 Area 对应一个房间，可附加智能家居属性：

```javascript
// Area 属性扩展（在墙体围合的 Area 上注册）
export const SmartArea = {
  name: 'smart-room',
  prototype: 'areas',
  info: { title: '智能房间', tag: ['smart'] },
  properties: {
    roomName:    { label: '房间名称', type: 'string',  defaultValue: '未命名房间' },
    roomType:    { label: '房间类型', type: 'enum',
      defaultValue: 'living',
      values: {
        living:  '客厅', bedroom: '卧室', kitchen: '厨房',
        bathroom: '卫生间', balcony: '阳台', study: '书房',
      }
    },
    targetTemp:  { label: '目标温度', type: 'number', defaultValue: 26 },
    targetLight: { label: '目标亮度', type: 'number', defaultValue: 80 },
    occupied:    { label: '有人状态', type: 'toggle', defaultValue: false },
  },
  render2D: (element) => {
    // 房间面积标注 + 人员状态指示
    return (/* SVG 房间标注 */);
  },
  render3D: () => Promise.resolve(new Three.Group()),
};
```

### 9.2 自动化场景配置

```javascript
// src/smart-home/models/scene-config.js

// 场景配置数据结构（存储在 smart-home Redux slice）
const SCENE_SCHEMA = {
  id:          'uuid',
  name:        '回家模式',
  icon:        'home',
  trigger: {
    type:    'manual | time | device_state | geofence',
    config:  {},        // 触发器具体配置
  },
  conditions: [],       // 执行条件
  actions: [
    {
      targetType: 'device | room | all',
      targetId:   'deviceId | roomId | *',
      command:    { action: 'set_power', value: true },
      delay:      0,    // 延迟毫秒
    }
  ],
};

// 典型场景预设
export const PRESET_SCENES = [
  {
    id: 'scene_home',
    name: '回家模式',
    actions: [
      { targetId: 'living_lights', command: Commands.lightOn() },
      { targetId: 'ac_living',     command: Commands.acOn() },
      { targetId: 'entrance_lock', command: Commands.unlockDoor() },
    ]
  },
  {
    id: 'scene_leave',
    name: '离家模式',
    actions: [
      { targetId: '*', command: Commands.lightOff() },
      { targetId: '*', command: Commands.acOff() },
      { targetId: 'entrance_lock', command: Commands.lockDoor() },
    ]
  },
  {
    id: 'scene_sleep',
    name: '睡眠模式',
    actions: [
      { targetId: '*',              command: Commands.lightOff() },
      { targetId: 'bedroom_ac',    command: Commands.setTemp(26) },
      { targetId: 'bedroom_curtain', command: Commands.curtainClose() },
    ]
  },
];
```

---

## 10. 后端 API 对接规范

### 10.1 户型数据接口

```
GET    /api/homes/{homeId}/floorplan          获取户型数据
PUT    /api/homes/{homeId}/floorplan          保存户型数据
GET    /api/homes/{homeId}/floorplan/devices  获取设备布局（item 绑定关系）
```

```typescript
// 户型数据结构（与 planner scene.toJS() 对应）
interface FloorPlanData {
  unit: 'cm' | 'm' | 'in' | 'ft';
  layers: Record<string, LayerData>;
  grids: Record<string, GridData>;
  meta: {
    homeId: string;
    homeName: string;
    updatedAt: string;
    version: number;
  };
}
```

### 10.2 设备管理接口

```
GET    /api/homes/{homeId}/devices            获取所有设备列表
GET    /api/homes/{homeId}/devices/{id}       获取单个设备详情
POST   /api/homes/{homeId}/devices/{id}/bind  绑定设备到 item
POST   /api/homes/{homeId}/devices/{id}/cmd   发送控制指令
GET    /api/homes/{homeId}/devices/{id}/log   获取操作日志
```

```typescript
// 设备信息
interface DeviceInfo {
  deviceId:   string;
  deviceName: string;
  protocol:   'zigbee' | 'wifi' | 'zwave' | 'matter';
  productId:  string;
  roomId?:    string;
  itemId?:    string;       // 绑定的 planner item id
  online:     boolean;
  status:     Record<string, any>;  // 设备实时状态
  createdAt:  string;
}

// 控制指令
interface DeviceCommand {
  action:    string;
  value?:    any;
  requestId: string;
  timestamp: number;
}
```

### 10.3 MQTT Topic 规范

```
上报方向（设备 → 平台）：
  home/{homeId}/device/{deviceId}/status    状态上报
  home/{homeId}/device/{deviceId}/event     事件上报（门铃、人体感应等）
  home/{homeId}/device/{deviceId}/alert     告警上报

控制方向（平台 → 设备）：
  home/{homeId}/device/{deviceId}/control   控制指令
  home/{homeId}/device/{deviceId}/config    配置下发

系统主题：
  home/{homeId}/scene/{sceneId}/trigger     场景触发
  home/{homeId}/broadcast                   广播消息
```

```json
// 状态上报 Payload 示例
{
  "deviceId": "light_001",
  "timestamp": 1711296000000,
  "data": {
    "online": true,
    "power": true,
    "brightness": 80,
    "colorTemp": 4000,
    "color": "#FFFFFF"
  }
}
```

### 10.4 设备发现与配网接口

```
GET    /api/homes/{homeId}/discovery/start   开始扫描设备
GET    /api/homes/{homeId}/discovery/list    获取扫描到的设备列表
POST   /api/homes/{homeId}/discovery/pair   配网设备
DELETE /api/homes/{homeId}/devices/{id}     移除设备
```

---

## 11. Redux 状态扩展方案

### 11.1 完整 Store 结构

```javascript
// src/store/index.js
import { createStore, combineReducers } from 'redux';
import { Map } from 'immutable';
import { reducer as PlannerReducer, Models as PlannerModels } from 'react-planner';
import { smartHomeSliceReducer }  from './smart-home-slice';
import { smartHomeReducer }       from '../smart-home/reducers/smart-home-reducer';

let AppState = Map({
  'react-planner': new PlannerModels.State(),
  'smart-home': Map({
    deviceStatuses: Map(),    // deviceId → 实时状态
    scenes:         Map(),    // sceneId → 场景配置
    alerts:         [],       // 告警队列
    rooms:          Map(),    // roomId → 房间附加信息
    mqttConnected:  false,
  }),
});

let reducer = (state = AppState, action) => {
  state = state.update('react-planner',
    s => PlannerReducer(s, action));
  state = state.update('react-planner',
    s => smartHomeReducer(s, action));
  state = state.update('smart-home',
    s => smartHomeSliceReducer(s, action));
  return state;
};

export const store = createStore(
  reducer,
  null,
  window.__REDUX_DEVTOOLS_EXTENSION__?.() || (f => f)
);
```

### 11.2 状态选择器

```javascript
// src/store/selectors.js

// planner 状态选择器（传给 ReactPlanner）
export const plannerStateExtractor = state => state.get('react-planner');

// 按 deviceId 获取实时状态
export const selectDeviceStatus = (state, deviceId) =>
  state.getIn(['smart-home', 'deviceStatuses', deviceId]);

// 获取某房间所有设备
export const selectDevicesByRoom = (state, roomId) => {
  const plannerState = plannerStateExtractor(state);
  const layers = plannerState.getIn(['scene', 'layers']);
  const devices = [];
  layers.forEach((layer, layerId) => {
    layer.get('items').forEach((item, itemId) => {
      if (item.getIn(['properties', 'roomId']) === roomId) {
        devices.push({ layerId, itemId, item });
      }
    });
  });
  return devices;
};

// 获取所有告警中的设备
export const selectAlertDevices = (state) =>
  state.getIn(['smart-home', 'alerts']);
```

---

## 12. 前端工程集成步骤

### 12.1 安装依赖

```bash
npm install react-planner immutable redux react-redux mqtt three
npm install react-svg-pan-zoom react-icons react-tabs convert-units
```

### 12.2 目录结构

```
src/
├── smart-home/
│   ├── catalog/
│   │   ├── items/
│   │   │   ├── smart-light/
│   │   │   ├── smart-camera/
│   │   │   ├── smart-thermostat/
│   │   │   ├── motion-sensor/
│   │   │   └── ...
│   │   ├── holes/
│   │   │   ├── smart-switch/
│   │   │   ├── smart-lock/
│   │   │   └── smart-curtain/
│   │   ├── areas/
│   │   │   └── smart-room/
│   │   └── smart-catalog.js
│   │
│   ├── plugins/
│   │   ├── mqtt-plugin.js
│   │   ├── sync-plugin.js
│   │   └── alert-plugin.js
│   │
│   ├── actions/
│   │   └── device-actions.js
│   │
│   ├── reducers/
│   │   ├── smart-home-reducer.js   (扩展 planner state)
│   │   └── smart-home-slice.js     (独立 slice)
│   │
│   ├── components/
│   │   ├── device-control-panel.jsx
│   │   ├── room-info-panel.jsx
│   │   ├── scene-manager-panel.jsx
│   │   ├── alert-panel.jsx
│   │   └── toolbar/
│   │       ├── device-bind-button.jsx
│   │       └── scene-trigger-button.jsx
│   │
│   ├── services/
│   │   ├── device-control.js
│   │   └── floor-plan-api.js
│   │
│   └── utils/
│       ├── element-utils.js
│       └── device-style-utils.js
│
├── store/
│   ├── index.js
│   └── selectors.js
│
└── app.jsx
```

### 12.3 主入口组装

```jsx
// src/app.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import ContainerDimensions from 'react-container-dimensions';
import { ReactPlanner, Plugins as PlannerPlugins } from 'react-planner';
import { store }            from './store';
import SmartHomeCatalog     from './smart-home/catalog/smart-catalog';
import MqttPlugin           from './smart-home/plugins/mqtt-plugin';
import SyncPlugin           from './smart-home/plugins/sync-plugin';
import DeviceControlPanel   from './smart-home/components/device-control-panel';
import SceneManagerPanel    from './smart-home/components/scene-manager-panel';
import DeviceBindButton     from './smart-home/components/toolbar/device-bind-button';

const HOME_ID   = window.__HOME_ID__ || 'home001';
const BROKER_URL = process.env.REACT_APP_MQTT_URL;

const plugins = [
  PlannerPlugins.Keyboard(),
  MqttPlugin({ brokerUrl: BROKER_URL, homeId: HOME_ID }),
  SyncPlugin({ homeId: HOME_ID, saveDelay: 2000 }),
  PlannerPlugins.ConsoleDebugger(),
];

ReactDOM.render(
  <Provider store={store}>
    <ContainerDimensions>
      {({ width, height }) => (
        <ReactPlanner
          catalog={SmartHomeCatalog}
          width={width}
          height={height}
          plugins={plugins}
          stateExtractor={state => state.get('react-planner')}
          sidebarComponents={[DeviceControlPanel, SceneManagerPanel]}
          toolbarButtons={[DeviceBindButton]}
        />
      )}
    </ContainerDimensions>
  </Provider>,
  document.getElementById('root')
);
```

---

## 13. 安全与权限设计

### 13.1 设备操作权限

```javascript
// 用户角色 → 操作权限映射
const PERMISSIONS = {
  owner:   ['view', 'edit_plan', 'control', 'manage_scene', 'manage_device'],
  family:  ['view', 'control', 'trigger_scene'],
  guest:   ['view', 'control_basic'],   // 仅允许开关灯等基础操作
  visitor: ['view'],
};

// 在设备控制前鉴权
function checkPermission(userRole, action) {
  const allowed = PERMISSIONS[userRole] || [];
  return allowed.includes(action);
}
```

### 13.2 敏感操作保护

- **门锁操作**：需要二次确认 + PIN 码验证
- **安防设备**（摄像头）：视频流需单独鉴权 Token
- **户型数据导出**：仅 owner 权限可操作
- **设备配网**：操作需在局域网内或使用 OTP

### 13.3 数据传输安全

```
MQTT：使用 WSS（TLS），用户名/密码 + 证书双向认证
REST API：HTTPS + JWT Bearer Token
户型数据：敏感房间类型（卧室）可选择性加密存储
```

---

## 14. 性能优化建议

### 14.1 状态更新优化

```javascript
// 高频 MQTT 消息节流（避免每次消息都触发 re-render）
const throttledDispatch = throttle((dispatch, action) => {
  dispatch(action);
}, 200);  // 最多 5 次/秒

// 批量更新多个设备状态（减少 render 次数）
store.dispatch(batchUpdateDeviceStatus([
  { layerId, itemId: 'item1', statusPatch: { power: true } },
  { layerId, itemId: 'item2', statusPatch: { brightness: 80 } },
]));
```

### 14.2 3D 渲染优化

- 使用 `updateRender3D`（planner 支持）在状态变化时**增量更新** Mesh 而非重建
- 对离屏设备使用 `LOD`（Three.js Level of Detail）
- 每种设备类型缓存 Geometry 和 Material，避免重复创建

### 14.3 大型户型优化

- 开启 planner 内置的 **Layer 可见性控制**，按需渲染楼层
- 设备列表超过 200 个时，2D 视图使用 Canvas 而非 SVG

---

## 15. 附录：关键文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/react-planner.jsx` | ReactPlanner 主组件，props 接口定义 |
| `src/models.js` | 所有 Immutable Record 数据模型 |
| `src/constants.js` | 所有 Action 类型常量和 Mode 常量 |
| `src/catalog/catalog.js` | Catalog 类，`registerElement` API |
| `src/class/item.js` | Item 静态操作类（create/select/remove） |
| `src/class/area.js` | Area 静态操作类（含 `detectAndUpdateAreas`） |
| `src/reducers/reducer.js` | 主 reducer，action 路由逻辑 |
| `src/actions/items-actions.js` | Items 相关 Action Creator |
| `src/plugins/autosave.js` | 自动保存插件（SyncPlugin 参考原型） |
| `src/utils/geometry-utils.js` | 几何计算工具（坐标变换等） |
| `src/components/viewer2d/item.jsx` | 2D Item 渲染组件（调用 render2D） |
| `src/components/viewer3d/scene-creator.js` | 3D 场景构建（调用 render3D） |
| `demo/src/catalog/mycatalog.js` | 完整 Catalog 注册示例 |
| `demo/src/renderer.jsx` | 完整 Redux Store 集成示例 |

---

*文档由技术分析自动生成，基于 react-planner v2.0.6 源码及官方 DeepWiki 文档。*
*如需进一步细化某一模块（如特定设备的 3D 模型、MQTT 协议适配、或场景编排 UI），可继续扩展。*
