import assert from "node:assert/strict";
import { test } from "node:test";
import { guestIdFromQr, guestQrUrl } from "./guestQr.js";

test("each guest document ID produces its own RSVP QR URL", () => {
  const firstUrl = new URL(guestQrUrl("guest-one", "https://wedding.example"));
  const secondUrl = new URL(guestQrUrl("guest-two", "https://wedding.example"));

  assert.equal(firstUrl.searchParams.get("invite"), "guest-one");
  assert.equal(secondUrl.searchParams.get("invite"), "guest-two");
  assert.notEqual(firstUrl.toString(), secondUrl.toString());
});

test("scanned QR URLs resolve only to their matching invitation ID", () => {
  assert.equal(guestIdFromQr("https://wedding.example/?invite=guest-one"), "guest-one");
  assert.equal(guestIdFromQr("https://wedding.example/?invite=guest-two"), "guest-two");
  assert.notEqual(
    guestIdFromQr(guestQrUrl("guest-one", "https://wedding.example")),
    guestIdFromQr(guestQrUrl("guest-two", "https://wedding.example")),
  );
});

test("scanner also accepts a copied guest ID", () => {
  assert.equal(guestIdFromQr("guest-one"), "guest-one");
  assert.equal(guestIdFromQr("  "), "");
});