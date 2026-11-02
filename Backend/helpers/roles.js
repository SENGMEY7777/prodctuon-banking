/**
 * Role values are persisted in `users.role` and included in JWTs.
 * Keep these numeric values stable because they are part of the API contract.
 */
const ROLES = Object.freeze({
  CUSTOMER: 0,
  TELLER: 1,
  ADMIN: 2
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

function isRole(value) {
  return ALL_ROLES.includes(Number(value));
}

module.exports = { ROLES, ALL_ROLES, isRole };
