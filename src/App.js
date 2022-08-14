import './App.css';
import React from 'react';
import { BrowserRouter, Switch, Route, } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Top from './pages/top';
function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact={true} path='/gluttonous_snake' component={Top} />
          <Route path='/index' component={Top} />
        </Switch>
      </BrowserRouter>
    </>
  );
}

export default App;
