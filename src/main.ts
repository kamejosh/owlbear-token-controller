import ReactDOM from "react-dom/client";
import React from "react";
import "./main.scss";
import { TokenController } from "./components/TokenController.tsx";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(TokenController));
