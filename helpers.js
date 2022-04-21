
const accountCheck = function(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      console.log("match found: ", user);
      return users[user];
    }
  }
  return false;
};





module.exports = { accountCheck };