document.getElementById("header-button").addEventListener("click", function() {
  var x = document.getElementById("nav");
  var h = "hidden";
  var s = "show";
  if (x.classList.contains(h)) {
    x.classList.remove(h);
    x.classList.add(s);
  } else if (x.classList.contains(s)) {
    x.classList.remove(s);
    x.classList.add(h);
  } else {
    x.classList.add(s);
  }
});
