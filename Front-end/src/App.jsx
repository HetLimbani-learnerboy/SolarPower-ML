import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landingpage from './Components/Landingpage';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUpPage';
import ForgotPassword from './Components/ForgotPassword';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Landingpage />} />
        <Route path='/signinpage' element={<SignIn />} />
        <Route path='/signuppage' element={<SignUp/>}/>
        <Route path='/forgotpassword' element={<ForgotPassword/>}/>
      </Routes>
    </div>
  );
}

export default App;
