
console.log("conncected")

const toggler =  document.getElementById("customSwitches")
toggler.addEventListener("click", function (e) {
    console.log("clicked")
  

    document.querySelector(".coordinates").classList.toggle("d-none")


})


