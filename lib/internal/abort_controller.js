'use strict';

// Modeled very closely on the AbortController implementation
// in https://github.com/mysticatea/abort-controller (MIT license)

const {
  ObjectAssign,
  ObjectDefineProperties,
  Symbol,
} = primordials;

const {
  defineEventHandler,
  EventTarget,
  Event,
  kTrustEvent
} = require('internal/event_target');
const {
  customInspectSymbol,
  emitExperimentalWarning
} = require('internal/util');
const { inspect } = require('internal/util/inspect');

const kAborted = Symbol('kAborted');

function customInspect(self, obj, depth, options) {
  if (depth < 0)
    return self;

  const opts = ObjectAssign({}, options, {
    depth: options.depth === null ? null : options.depth - 1
  });

  return `${self.constructor.name} ${inspect(obj, opts)}`;
}

class AbortSignal extends EventTarget {
  get aborted() { return !!this[kAborted]; }

  [customInspectSymbol](depth, options) {
    return customInspect(this, {
      aborted: this.aborted
    }, depth, options);
  }
}

ObjectDefineProperties(AbortSignal.prototype, {
  aborted: { enumerable: true }
});

function abortSignal(signal) {
  if (signal[kAborted]) return;
  signal[kAborted] = true;
  const event = new Event('abort', {
    [kTrustEvent]: true
  });
  signal.dispatchEvent(event);
}

// TODO(joyeecheung): V8 snapshot does not support instance member
// initializers for now:
// https://bugs.chromium.org/p/v8/issues/detail?id=10704
const kSignal = Symbol('signal');
class AbortController {
  constructor() {
    this[kSignal] = new AbortSignal();
    emitExperimentalWarning('AbortController');
    defineEventHandler(this[kSignal], 'abort');
  }

  get signal() { return this[kSignal]; }
  abort() { abortSignal(this[kSignal]); }

  [customInspectSymbol](depth, options) {
    return customInspect(this, {
      signal: this.signal
    }, depth, options);
  }
}

ObjectDefineProperties(AbortController.prototype, {
  signal: { enumerable: true },
  abort: { enumerable: true }
});

module.exports = {
  AbortController,
  AbortSignal,
};
