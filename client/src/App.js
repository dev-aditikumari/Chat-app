import React from 'react'
import {BrowserRouter,Routes,Route} from 'react-router-dom'

const App = () => {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path="/register" element ={<Register/>}/>
        <Route path="/login" element ={<Login/>}/>
        <Route path="/setAvatar" element ={<SetAvatar/>}/>
        <Route path="/" element ={<Chat/>}/>
       
        </Routes></BrowserRouter>
    </div>
  )
}

export default App