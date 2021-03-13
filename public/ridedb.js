const BASE_URL = `http://127.0.0.1:3000/rider/changedb/${rid}`;

const fun = () => {
    axios.get(`http://localhost:3000/rider/changedb/${rid}`)
.then(function (response) {
    // handle success
    console.log(response.data)
    if(response.data == false) window.location.reload();
  })
  .catch(function (error) {
    // handle error
    console.log("Error " , error);
   
  })

}

setInterval(fun,1000)