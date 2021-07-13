// https://github.com/andytuba/traceryhosting-send_tweet/blob/master/send_tweet.js

// this is much more complex than i thought it would be
// but this function will find our image tags 
// full credit to BooDooPerson - https://twitter.com/BooDooPerson/status/683450163608817664
// Reverse the string, check with our fucked up regex, return null or reverse matches back

var matchBrackets = function(text) {
  
  // simple utility function
  function reverseString(s) {
    return s.split('').reverse().join('');
  }

  // this is an inverstion of the natural order for this RegEx:
  var bracketsRe = /(\}(?!\\)(.+?)\{(?!\\))/g;

  text = reverseString(text);
  var matches = text.match(bracketsRe);
  if(matches === null) {
    return null;
  }
  else {
    return matches.map(reverseString).reverse();
  }
}


//see matchBrackets for why this is like this
function removeBrackets (text) {
  
  // simple utility function
  var reverseString = function(s) {
    return s.split('').reverse().join('');
  }

  // this is an inverstion of the natural order for this RegEx:
  var bracketsRe = /(\}(?!\\)(.+?)\{(?!\\))/g;

  text = reverseString(text);
  return reverseString(text.replace(bracketsRe, ""));
}

exports.matchBrackets = matchBrackets;
exports.removeBrackets = removeBrackets;
