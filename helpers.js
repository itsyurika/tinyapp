
const helperFunctions = (urlDatabase) => {

  const accountCheck = function(email, users) {
    for (const user in users) {
      if (users[user].email === email) {
        return users[user];
      }
    }
    return false;
  };

  function generateRandomString() {
    let randomString = "";
    const characterSet = "abcdefghijklmnopqrstuvwxyz0123456789";
    const setLength = characterSet.length;
    for (let i = 0; i < 7; i++) {
      randomString += characterSet.charAt(Math.floor(Math.random() * setLength));
    }
    return randomString;
  }

  function urlsForUser(id) {
    let userDatabase = {};
    for (const shortURL in urlDatabase) { //if the path id = userID, then will search through the database to filter URLs
      if (urlDatabase[shortURL].userID === id) {
        userDatabase[shortURL] = urlDatabase[shortURL].longURL;
      }
    }
    return userDatabase;
  }

  return { accountCheck, generateRandomString, urlsForUser };

};



module.exports = { helperFunctions };