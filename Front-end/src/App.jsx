import React from "react";
import { Routes, Route } from "react-router-dom";
import Landingpage from "./Components/Landingpage";
import SignUp from "./Components/SignUpPage";
import SignIn from "./Components/SignIn";
import ForgotPassword from "./Components/ForgotPassword";
 import WeatherPage from "./Components/WeatherPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landingpage />} />
         <Route path="/signuppage" element={<SignUp />} />
         <Route path="/signinpage" element={<SignIn />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />          
        <Route path="/weatherpage" element={<WeatherPage />} /> 
      </Routes>
    </div>
  );
}

export default App;
