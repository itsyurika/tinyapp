const { assert } = require('chai');

const { accountCheck } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = accountCheck("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, testUsers[expectedUserID]);
  });

  it('should return false with a non-existent email', function() {
    const user = accountCheck("hello@example.com", testUsers);
    assert.equal(user, false);
  });
});