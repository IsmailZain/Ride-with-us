// const axios = require('axios');
// import axios from './axios';

const BASE_URL = `http://127.0.0.1:3000/driver/changedb/${did}`;

// const getTodos = async () => {
//   try {
//     const res = await axios.get(`${BASE_URL}`);

//     const avl = res.data;

//     console.log(`GET: Here's the list of todos`, avl);
//     if(avl === "false") window.location.reload();


//     return todos;
//   } catch (e) {
//     console.error(e);
//   }
// };
//setInterval(getTodos,1000)
// getTodos()

// alert("hello")
// const func = () => {
//     console.log("hello g")
//     require('http').get(`http://127.0.0.1:3000/driver/changedb/${did}`, (res) => {
//         res.setEncoding('utf8');
//         res.on('data', function (body) {
    
//             console.log(body,"Hi");
//             if(body.data === "false") window.location.reload();
//         });
//     });
   

// }






const fun = () => {
    axios.get(`http://localhost:3000/driver/changedb/${did}`)
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




