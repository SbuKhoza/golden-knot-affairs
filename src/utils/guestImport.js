import { parseCsv } from "@/utils/csv";
import { normalise } from "@/utils/format";

const HEADER_ALIASES = {
  firstname: "firstName",
  "first name": "firstName",
  surname: "surname",
  lastname: "surname",
  "last name": "surname",
  email: "email",
  phone: "phone",
  seats: "numberOfSeats",
  table: "tableNumber",
  "table number": "tableNumber",
  "number of seats": "numberOfSeats",
  "plus one allowed": "plusOneAllowed",
  plusoneallowed: "plusOneAllowed",
  "plus one": "plusOneAllowed",
};

function toBoolean(value) {
  const v = normalise(value);
  return v === "true" || v === "yes" || v === "1";
}

/**
 * Parses a guest-import CSV (see README example: "First Name,Surname,Email,
 * Phone,Seats,Plus One Allowed") and validates it, without touching
 * Firestore. Returns valid rows ready to save, plus invalid/duplicate rows
 * so the admin can review counts before confirming the import.
 */
export function parseGuestImportCsv(text, existingGuests = []) {
  const rows = parseCsv(text);
  if (!rows.length) {
    return { valid: [], invalid: [], duplicates: [], errors: ["The file is empty."] };
  }

  const header = rows[0].map((h) => HEADER_ALIASES[normalise(h)] || null);
  if (!header.includes("firstName") || !header.includes("surname")) {
    return {
      valid: [],
      invalid: [],
      duplicates: [],
      errors: ['The CSV must include "First Name" and "Surname" columns.'],
    };
  }

  const existingKeys = new Set(
    existingGuests.map((g) => `${normalise(g.firstName)}|${normalise(g.surname)}`),
  );
  const seenInFile = new Set();

  const valid = [];
  const invalid = [];
  const duplicates = [];

  rows.slice(1).forEach((cols, index) => {
    const record = {};
    header.forEach((key, i) => {
      if (key) record[key] = (cols[i] || "").trim();
    });
    const rowNumber = index + 2; // +1 for header row, +1 for 1-based counting

    if (!record.firstName || !record.surname) {
      invalid.push({ rowNumber, reason: "Missing first name or surname.", record });
      return;
    }

    const key = `${normalise(record.firstName)}|${normalise(record.surname)}`;
    if (existingKeys.has(key) || seenInFile.has(key)) {
      duplicates.push({ rowNumber, reason: "Already invited.", record });
      return;
    }
    seenInFile.add(key);

    const seats = Number(record.numberOfSeats);
    valid.push({
      rowNumber,
      firstName: record.firstName,
      surname: record.surname,
      email: record.email || "",
      phone: record.phone || "",
      numberOfSeats: Number.isFinite(seats) && seats > 0 ? Math.round(seats) : 1,
      plusOneAllowed: toBoolean(record.plusOneAllowed),
      tableNumber: record.tableNumber || "",
      invitationType: "individual",
    });
  });

  return { valid, invalid, duplicates, errors: [] };
}