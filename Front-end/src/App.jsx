import React from "react";
import { Routes, Route } from "react-router-dom";
import Landingpage from "./Components/Landingpage";
import SignUp from "./Components/SignUpPage";
import SignIn from "./Components/SignIn";
import ForgotPassword from "./Components/ForgotPassword";
import WeatherPage from "./Components/WeatherPage";
import MainDashboard from "./Components/MainDashboard";
import PrivateComponents from "./Components/PrivateComponnets";
import TryModelPage from "./Components/TryModelPage";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* 🔒 Protected Routes */}
        <Route element={<PrivateComponents />}>
          <Route path="/MainDashboard" element={<MainDashboard />} />
        </Route>

        {/* 🌐 Public Routes */}
        <Route path="/" element={<Landingpage />} />
        <Route path="/signuppage" element={<SignUp />} />
        <Route path="/signinpage" element={<SignIn />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/weatherpage" element={<WeatherPage />} />
        <Route path="/trymodelpage" element={<TryModelPage />} />
      </Routes>
    </div>
  );
}

export default App;
