import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landingpage from './Components/Landingpage';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUpPage';
import ForgotPassword from './Components/ForgotPassword';
import WeatherPage from './Components/WeatherPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Landingpage />} />
        <Route path='/signinpage' element={<SignIn />} />
        <Route path='/signuppage' element={<SignUp/>}/>
        <Route path='/forgotpassword' element={<ForgotPassword/>}/>
        <Route path='/weatherpage' element={<WeatherPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
