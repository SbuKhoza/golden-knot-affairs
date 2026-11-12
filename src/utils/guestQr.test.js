import assert from "node:assert/strict";
import { test } from "node:test";
import { guestIdFromQr, guestQrPayload } from "./guestQr.js";

test("each guest document ID produces its own QR payload", () => {
  assert.notEqual(guestQrPayload("guest-one"), guestQrPayload("guest-two"));
  assert.equal(guestIdFromQr(guestQrPayload("guest-one")), "guest-one");
  assert.equal(guestIdFromQr(guestQrPayload("guest-two")), "guest-two");
});

test("the QR payload is not a link, so generic scanners have nothing to open", () => {
  const payload = guestQrPayload("guest-one");
  assert.ok(!/^https?:/i.test(payload));
  assert.ok(!payload.includes("/"));
});

test("previously issued link-style QR codes still resolve to the right guest", () => {
  assert.equal(guestIdFromQr("https://wedding.example/?invite=guest-one"), "guest-one");
  assert.equal(guestIdFromQr("https://wedding.example/?invite=guest-two"), "guest-two");
});

test("scanner rejects junk and accepts a copied guest ID", () => {
  assert.equal(guestIdFromQr("guest-one"), "guest-one");
  assert.equal(guestIdFromQr("  "), "");
  assert.equal(guestIdFromQr("GKA1:"), "");
  assert.equal(guestIdFromQr("GKA1:bad id/../x"), "");
  assert.equal(guestIdFromQr("https://example.com/menu"), "");
});
