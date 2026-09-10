/** Shared message type constants for TypeCascade. */
(function (root) {
  const MSG = Object.freeze({
    START_PICK: "tc:start-pick",
    CANCEL_PICK: "tc:cancel-pick",
    ELEMENT_PICKED: "tc:element-picked",
    GET_SELECTION: "tc:get-selection",
    APPLY_OVERRIDE: "tc:apply-override",
    CLEAR_OVERRIDES: "tc:clear-overrides",
    INJECT_PROVIDER_FONT: "tc:inject-provider-font",
    PING: "tc:ping",
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { MSG };
  } else {
    root.TypeCascadeMessages = MSG;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);
