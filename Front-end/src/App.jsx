import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landingpage from './Components/Landingpage';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUpPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Landingpage />} />
        <Route path='/signinpage' element={<SignIn />} />
        <Route path='/signuppage' element={<SignUp/>}/>
      </Routes>
    </div>
  );
}

export default App;
