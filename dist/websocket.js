"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.keepStreamAlive = exports.userEventHandler = void 0;

var _lodash = _interopRequireDefault(require("lodash.zipobject"));

var _httpClient = _interopRequireDefault(require("./http-client"));

var _openWebsocket = _interopRequireDefault(require("./open-websocket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var endpoints = {
  base: 'wss://stream.binance.com:9443/ws',
  futures: 'wss://fstream.binance.com/ws'
};

var depthTransform = function depthTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    firstUpdateId: m.U,
    finalUpdateId: m.u,
    bidDepth: m.b.map(function (b) {
      return (0, _lodash.default)(['price', 'quantity'], b);
    }),
    askDepth: m.a.map(function (a) {
      return (0, _lodash.default)(['price', 'quantity'], a);
    })
  };
};

var futuresDepthTransform = function futuresDepthTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    transactionTime: m.T,
    symbol: m.s,
    firstUpdateId: m.U,
    finalUpdateId: m.u,
    prevFinalUpdateId: m.pu,
    bidDepth: m.b.map(function (b) {
      return (0, _lodash.default)(['price', 'quantity'], b);
    }),
    askDepth: m.a.map(function (a) {
      return (0, _lodash.default)(['price', 'quantity'], a);
    })
  };
};

var depth = function depth(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var variator = arguments.length > 3 ? arguments[3] : undefined;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var _symbol$toLowerCase$s = symbol.toLowerCase().split('@'),
        _symbol$toLowerCase$s2 = _slicedToArray(_symbol$toLowerCase$s, 2),
        symbolName = _symbol$toLowerCase$s2[0],
        updateSpeed = _symbol$toLowerCase$s2[1];

    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(symbolName, "@depth").concat(updateSpeed ? "@".concat(updateSpeed) : ''));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? variator === 'futures' ? futuresDepthTransform(obj) : depthTransform(obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var partialDepthTransform = function partialDepthTransform(symbol, level, m) {
  return {
    symbol: symbol,
    level: level,
    lastUpdateId: m.lastUpdateId,
    bids: m.bids.map(function (b) {
      return (0, _lodash.default)(['price', 'quantity'], b);
    }),
    asks: m.asks.map(function (a) {
      return (0, _lodash.default)(['price', 'quantity'], a);
    })
  };
};

var futuresPartDepthTransform = function futuresPartDepthTransform(level, m) {
  return {
    level: level,
    eventType: m.e,
    eventTime: m.E,
    transactionTime: m.T,
    symbol: m.s,
    firstUpdateId: m.U,
    finalUpdateId: m.u,
    prevFinalUpdateId: m.pu,
    bidDepth: m.b.map(function (b) {
      return (0, _lodash.default)(['price', 'quantity'], b);
    }),
    askDepth: m.a.map(function (a) {
      return (0, _lodash.default)(['price', 'quantity'], a);
    })
  };
};

var partialDepth = function partialDepth(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var variator = arguments.length > 3 ? arguments[3] : undefined;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (_ref) {
    var symbol = _ref.symbol,
        level = _ref.level;

    var _symbol$toLowerCase$s3 = symbol.toLowerCase().split('@'),
        _symbol$toLowerCase$s4 = _slicedToArray(_symbol$toLowerCase$s3, 2),
        symbolName = _symbol$toLowerCase$s4[0],
        updateSpeed = _symbol$toLowerCase$s4[1];

    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(symbolName, "@depth").concat(level).concat(updateSpeed ? "@".concat(updateSpeed) : ''));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? variator === 'futures' ? futuresPartDepthTransform(level, obj) : partialDepthTransform(symbol, level, obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var candles = function candles(payload, interval, cb) {
  var transform = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  var variator = arguments.length > 4 ? arguments[4] : undefined;

  if (!interval || !cb) {
    throw new Error('Please pass a symbol, interval and callback.');
  }

  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(symbol.toLowerCase(), "@kline_").concat(interval));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      var eventType = obj.e,
          eventTime = obj.E,
          symbol = obj.s,
          tick = obj.k;
      var startTime = tick.t,
          closeTime = tick.T,
          firstTradeId = tick.f,
          lastTradeId = tick.L,
          open = tick.o,
          high = tick.h,
          low = tick.l,
          close = tick.c,
          volume = tick.v,
          trades = tick.n,
          interval = tick.i,
          isFinal = tick.x,
          quoteVolume = tick.q,
          buyVolume = tick.V,
          quoteBuyVolume = tick.Q;
      cb(transform ? {
        eventType: eventType,
        eventTime: eventTime,
        symbol: symbol,
        startTime: startTime,
        closeTime: closeTime,
        firstTradeId: firstTradeId,
        lastTradeId: lastTradeId,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
        trades: trades,
        interval: interval,
        isFinal: isFinal,
        quoteVolume: quoteVolume,
        buyVolume: buyVolume,
        quoteBuyVolume: quoteBuyVolume
      } : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var miniTickerTransform = function miniTickerTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    curDayClose: m.c,
    open: m.o,
    high: m.h,
    low: m.l,
    volume: m.v,
    volumeQuote: m.q
  };
};

var tickerTransform = function tickerTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    priceChange: m.p,
    priceChangePercent: m.P,
    weightedAvg: m.w,
    prevDayClose: m.x,
    curDayClose: m.c,
    closeTradeQuantity: m.Q,
    bestBid: m.b,
    bestBidQnt: m.B,
    bestAsk: m.a,
    bestAskQnt: m.A,
    open: m.o,
    high: m.h,
    low: m.l,
    volume: m.v,
    volumeQuote: m.q,
    openTime: m.O,
    closeTime: m.C,
    firstTradeId: m.F,
    lastTradeId: m.L,
    totalTrades: m.n
  };
};

var futuresTickerTransform = function futuresTickerTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    priceChange: m.p,
    priceChangePercent: m.P,
    weightedAvg: m.w,
    curDayClose: m.c,
    closeTradeQuantity: m.Q,
    open: m.o,
    high: m.h,
    low: m.l,
    volume: m.v,
    volumeQuote: m.q,
    openTime: m.O,
    closeTime: m.C,
    firstTradeId: m.F,
    lastTradeId: m.L,
    totalTrades: m.n
  };
};

var ticker = function ticker(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var variator = arguments.length > 3 ? arguments[3] : undefined;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(symbol.toLowerCase(), "@ticker"));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? variator === 'futures' ? futuresTickerTransform(obj) : tickerTransform(obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var allTickers = function allTickers(cb) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var variator = arguments.length > 2 ? arguments[2] : undefined;
  var w = new _openWebsocket.default("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/!ticker@arr"));

  w.onmessage = function (msg) {
    var arr = JSON.parse(msg.data);
    cb(transform ? variator === 'futures' ? arr.map(function (m) {
      return futuresTickerTransform(m);
    }) : arr.map(function (m) {
      return tickerTransform(m);
    }) : arr);
  };

  return function (options) {
    return w.close(1000, 'Close handle was called', _objectSpread({
      keepClosed: true
    }, options));
  };
};

var miniTicker = function miniTicker(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(endpoints.base, "/").concat(symbol.toLowerCase(), "@miniTicker"));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? miniTickerTransform(obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var allMiniTicker = function allMiniTicker(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(endpoints.base, "/!miniTicker@arr"));

    w.onmessage = function (msg) {
      var arr = JSON.parse(msg.data);
      cb(transform ? arr.map(function (m) {
        return miniTickerTransform(m);
      }) : arr);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var customSubStream = function customSubStream(payload, cb, variator) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (sub) {
    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(sub));

    w.onmessage = function (msg) {
      var data = JSON.parse(msg.data);
      cb(data);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var aggTradesTransform = function aggTradesTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    timestamp: m.T,
    symbol: m.s,
    price: m.p,
    quantity: m.q,
    isBuyerMaker: m.m,
    wasBestPrice: m.M,
    aggId: m.a,
    firstId: m.f,
    lastId: m.l
  };
};

var futuresAggTradesTransform = function futuresAggTradesTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    aggId: m.a,
    price: m.p,
    quantity: m.q,
    firstId: m.f,
    lastId: m.l,
    timestamp: m.T,
    isBuyerMaker: m.m
  };
};

var aggTrades = function aggTrades(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var variator = arguments.length > 3 ? arguments[3] : undefined;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(symbol.toLowerCase(), "@aggTrade"));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? variator === 'futures' ? futuresAggTradesTransform(obj) : aggTradesTransform(obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var futuresLiqsTransform = function futuresLiqsTransform(m) {
  return {
    symbol: m.s,
    price: m.p,
    origQty: m.q,
    lastFilledQty: m.l,
    accumulatedQty: m.z,
    averagePrice: m.ap,
    status: m.X,
    timeInForce: m.f,
    type: m.o,
    side: m.S,
    time: m.T
  };
};

var futuresLiquidations = function futuresLiquidations(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(endpoints.futures, "/").concat(symbol.toLowerCase(), "@forceOrder"));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? futuresLiqsTransform(obj.o) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var futuresAllLiquidations = function futuresAllLiquidations(cb) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var w = new _openWebsocket.default("".concat(endpoints.futures, "/!forceOrder@arr"));

  w.onmessage = function (msg) {
    var obj = JSON.parse(msg.data);
    cb(transform ? futuresLiqsTransform(obj.o) : obj);
  };

  return function (options) {
    return w.close(1000, 'Close handle was called', _objectSpread({
      keepClosed: true
    }, options));
  };
};

var tradesTransform = function tradesTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    tradeTime: m.T,
    symbol: m.s,
    price: m.p,
    quantity: m.q,
    isBuyerMaker: m.m,
    maker: m.M,
    tradeId: m.t,
    buyerOrderId: m.b,
    sellerOrderId: m.a
  };
};

var trades = function trades(payload, cb) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(endpoints.base, "/").concat(symbol.toLowerCase(), "@trade"));

    w.onmessage = function (msg) {
      var obj = JSON.parse(msg.data);
      cb(transform ? tradesTransform(obj) : obj);
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var userTransforms = {
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#balance-update
  balanceUpdate: function balanceUpdate(m) {
    return {
      asset: m.a,
      balanceDelta: m.d,
      clearTime: m.T,
      eventTime: m.E,
      eventType: 'balanceUpdate'
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountInfo: function outboundAccountInfo(m) {
    return {
      eventType: 'account',
      eventTime: m.E,
      makerCommissionRate: m.m,
      takerCommissionRate: m.t,
      buyerCommissionRate: m.b,
      sellerCommissionRate: m.s,
      canTrade: m.T,
      canWithdraw: m.W,
      canDeposit: m.D,
      lastAccountUpdate: m.u,
      balances: m.B.reduce(function (out, cur) {
        out[cur.a] = {
          available: cur.f,
          locked: cur.l
        };
        return out;
      }, {})
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountPosition: function outboundAccountPosition(m) {
    return {
      balances: m.B.map(function (_ref2) {
        var a = _ref2.a,
            f = _ref2.f,
            l = _ref2.l;
        return {
          asset: a,
          free: f,
          locked: l
        };
      }),
      eventTime: m.E,
      eventType: 'outboundAccountPosition',
      lastAccountUpdate: m.u
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#order-update
  executionReport: function executionReport(m) {
    return {
      eventType: 'executionReport',
      eventTime: m.E,
      symbol: m.s,
      newClientOrderId: m.c,
      originalClientOrderId: m.C,
      side: m.S,
      orderType: m.o,
      timeInForce: m.f,
      quantity: m.q,
      price: m.p,
      executionType: m.x,
      stopPrice: m.P,
      icebergQuantity: m.F,
      orderStatus: m.X,
      orderRejectReason: m.r,
      orderId: m.i,
      orderTime: m.T,
      lastTradeQuantity: m.l,
      totalTradeQuantity: m.z,
      priceLastTrade: m.L,
      commission: m.n,
      commissionAsset: m.N,
      tradeId: m.t,
      isOrderWorking: m.w,
      isBuyerMaker: m.m,
      creationTime: m.O,
      totalQuoteTradeQuantity: m.Z,
      orderListId: m.g,
      quoteOrderQuantity: m.Q,
      lastQuoteTransacted: m.Y
    };
  }
};
var futuresUserTransforms = {
  // https://binance-docs.github.io/apidocs/futures/en/#event-margin-call
  MARGIN_CALL: function MARGIN_CALL(m) {
    return {
      eventTime: m.E,
      crossWalletBalance: m.cw,
      eventType: 'MARGIN_CALL',
      positions: m.p.reduce(function (out, cur) {
        out[cur.a] = {
          symbol: cur.s,
          positionSide: cur.ps,
          positionAmount: cur.pa,
          marginType: cur.mt,
          isolatedWallet: cur.iw,
          markPrice: cur.mp,
          unrealizedPnL: cur.up,
          maintenanceMarginRequired: cur.mm
        };
        return out;
      }, {})
    };
  },
  // https://binance-docs.github.io/apidocs/futures/en/#event-balance-and-position-update
  ACCOUNT_UPDATE: function ACCOUNT_UPDATE(m) {
    return {
      eventTime: m.E,
      transactionTime: m.T,
      eventType: 'ACCOUNT_UPDATE',
      eventReasonType: m.a.m,
      balances: m.a.B.map(function (b) {
        return {
          asset: b.a,
          walletBalance: b.wb,
          crossWalletBalance: b.cw,
          balanceChange: b.bc
        };
      }),
      positions: m.a.P.map(function (p) {
        return {
          symbol: p.s,
          positionAmount: p.pa,
          entryPrice: p.ep,
          accumulatedRealized: p.cr,
          unrealizedPnL: p.up,
          marginType: p.mt,
          isolatedWallet: p.iw,
          positionSide: p.ps
        };
      })
    };
  },
  // https://binance-docs.github.io/apidocs/futures/en/#event-order-update
  ORDER_TRADE_UPDATE: function ORDER_TRADE_UPDATE(m) {
    return {
      eventType: 'ORDER_TRADE_UPDATE',
      eventTime: m.E,
      transactionTime: m.T,
      symbol: m.o.s,
      clientOrderId: m.o.c,
      side: m.o.S,
      orderType: m.o.o,
      timeInForce: m.o.f,
      quantity: m.o.q,
      price: m.o.p,
      averagePrice: m.o.ap,
      stopPrice: m.o.sp,
      executionType: m.o.x,
      orderStatus: m.o.X,
      orderId: m.o.i,
      lastTradeQuantity: m.o.l,
      totalTradeQuantity: m.o.z,
      priceLastTrade: m.o.L,
      commissionAsset: m.o.N,
      commission: m.o.n,
      orderTime: m.o.T,
      tradeId: m.o.t,
      bidsNotional: m.o.b,
      asksNotional: m.o.a,
      isMaker: m.o.m,
      isReduceOnly: m.o.R,
      workingType: m.o.wt,
      originalOrderType: m.o.ot,
      positionSide: m.o.ps,
      closePosition: m.o.cp,
      activationPrice: m.o.AP,
      callbackRate: m.o.cr,
      realizedProfit: m.o.rp
    };
  }
};

var userEventHandler = function userEventHandler(cb) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var variator = arguments.length > 2 ? arguments[2] : undefined;
  return function (msg) {
    var _JSON$parse = JSON.parse(msg.data),
        type = _JSON$parse.e,
        rest = _objectWithoutProperties(_JSON$parse, ["e"]);

    cb(variator === 'futures' ? transform && futuresUserTransforms[type] ? futuresUserTransforms[type](rest) : _objectSpread({
      type: type
    }, rest) : transform && userTransforms[type] ? userTransforms[type](rest) : _objectSpread({
      type: type
    }, rest));
  };
};

exports.userEventHandler = userEventHandler;
var STREAM_METHODS = ['get', 'keep', 'close'];

var capitalize = function capitalize(str, check) {
  return check ? "".concat(str[0].toUpperCase()).concat(str.slice(1)) : str;
};

var getStreamMethods = function getStreamMethods(opts) {
  var variator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var methods = (0, _httpClient.default)(opts);
  return STREAM_METHODS.reduce(function (acc, key) {
    return [].concat(_toConsumableArray(acc), [methods["".concat(variator).concat(capitalize("".concat(key, "DataStream"), !!variator))]]);
  }, []);
};

var keepStreamAlive = function keepStreamAlive(method, listenKey) {
  return method({
    listenKey: listenKey
  });
};

exports.keepStreamAlive = keepStreamAlive;

var user = function user(opts, variator) {
  return function (cb, transform) {
    var _getStreamMethods = getStreamMethods(opts, variator),
        _getStreamMethods2 = _slicedToArray(_getStreamMethods, 3),
        getDataStream = _getStreamMethods2[0],
        keepDataStream = _getStreamMethods2[1],
        closeDataStream = _getStreamMethods2[2];

    var currentListenKey = null;
    var int = null;
    var w = null;

    var keepAlive = function keepAlive(isReconnecting) {
      if (currentListenKey) {
        keepStreamAlive(keepDataStream, currentListenKey).catch(function () {
          closeStream({}, true);

          if (isReconnecting) {
            setTimeout(function () {
              return makeStream(true);
            }, 30e3);
          } else {
            makeStream(true);
          }
        });
      }
    };

    var closeStream = function closeStream(options, catchErrors) {
      if (currentListenKey) {
        clearInterval(int);
        var p = closeDataStream({
          listenKey: currentListenKey
        });

        if (catchErrors) {
          p.catch(function (f) {
            return f;
          });
        }

        w.close(1000, 'Close handle was called', _objectSpread({
          keepClosed: true
        }, options));
        currentListenKey = null;
      }
    };

    var makeStream = function makeStream(isReconnecting) {
      return getDataStream().then(function (_ref3) {
        var listenKey = _ref3.listenKey;
        w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? endpoints.futures : endpoints.base, "/").concat(listenKey));

        w.onmessage = function (msg) {
          return userEventHandler(cb, transform, variator)(msg);
        };

        currentListenKey = listenKey;
        int = setInterval(function () {
          return keepAlive(false);
        }, 50e3);
        keepAlive(true);
        return function (options) {
          return closeStream(options);
        };
      }).catch(function (err) {
        if (isReconnecting) {
          setTimeout(function () {
            return makeStream(true);
          }, 30e3);
        } else {
          throw err;
        }
      });
    };

    return makeStream(false);
  };
};

var _default = function _default(opts) {
  if (opts && opts.wsBase) {
    endpoints.base = opts.wsBase;
  }

  if (opts && opts.wsFutures) {
    endpoints.futures = opts.wsFutures;
  }

  return {
    depth: depth,
    partialDepth: partialDepth,
    candles: candles,
    trades: trades,
    aggTrades: aggTrades,
    ticker: ticker,
    allTickers: allTickers,
    miniTicker: miniTicker,
    allMiniTicker: allMiniTicker,
    customSubStream: customSubStream,
    user: user(opts),
    marginUser: user(opts, 'margin'),
    futuresDepth: function futuresDepth(payload, cb, transform) {
      return depth(payload, cb, transform, 'futures');
    },
    futuresPartialDepth: function futuresPartialDepth(payload, cb, transform) {
      return partialDepth(payload, cb, transform, 'futures');
    },
    futuresCandles: function futuresCandles(payload, interval, cb, transform) {
      return candles(payload, interval, cb, transform, 'futures');
    },
    futuresTicker: function futuresTicker(payload, cb, transform) {
      return ticker(payload, cb, transform, 'futures');
    },
    futuresAllTickers: function futuresAllTickers(cb, transform) {
      return allTickers(cb, transform, 'futures');
    },
    futuresAggTrades: function futuresAggTrades(payload, cb, transform) {
      return aggTrades(payload, cb, transform, 'futures');
    },
    futuresLiquidations: futuresLiquidations,
    futuresAllLiquidations: futuresAllLiquidations,
    futuresUser: user(opts, 'futures'),
    futuresCustomSubStream: function futuresCustomSubStream(payload, cb) {
      return customSubStream(payload, cb, 'futures');
    }
  };
};

exports.default = _default;