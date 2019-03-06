import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch
} from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Lander from "./containers/Lander";
import SignIn from "./containers/SignIn";
import Dashboard from "./containers/Dashboard";
import Confirmed from "./containers/Confirmed";
import Profile from "./containers/Profile";
import Header from "./containers/Header";
import { UserContext } from "./contexts/userContext";
import { CenteredDiv, H1, Toast, Spinner } from "./components";
import styled from "styled-components";
import firebase from "./firebase.js";
import "firebase/firestore";

const AppWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: absolute;
`;

const MainRouter = () => {
  const [initializationComplete, setInitComplete] = useState(false);
  const { userState, userDispatch } = useContext(UserContext);
  const userId = userState.userId;
  const db = firebase.firestore();

  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (!!user) {
        const uid = firebase.auth().currentUser.uid;
        let persistedUser = window.localStorage.getItem("userData");
        if (!persistedUser) {
          db.collection("users")
            .doc(uid)
            .get()
            .then(res => {
              if (res.data() && res.data().firstName) {
                userDispatch({ type: "additionalInfo", payload: res.data() });
                window.localStorage.setItem(
                  "userData",
                  JSON.stringify(res.data())
                );
              }
              userDispatch({ type: "userId", payload: uid });
              setInitComplete(true);
            });
        } else {
          userDispatch({
            type: "additionalInfo",
            payload: JSON.parse(persistedUser)
          });
          userDispatch({ type: "userId", payload: uid });
          setInitComplete(true);
        }
      } else {
        userDispatch({
          type: "additionalInfo",
          payload: { firstName: null, lastName: null, email: null }
        });
        setInitComplete(true);
      }
    });
  }, []);

  const noMatch = () => {
    return <H1>404</H1>;
  };

  const routeWithAuth = destination => {
    return !userId ? (
      <Redirect
        to={{
          pathname: "/signin"
        }}
      />
    ) : (
      destination
    );
  };

  const reRouteIfAuthenticated = destination => {
    return userId ? (
      <Redirect
        to={{
          pathname: "/dashboard"
        }}
      />
    ) : (
      destination
    );
  };

  const nestedSwitch = () => {
    return (
      <AppWrapper>
        <Toast />
        <Header />
        <Route
          render={({ location }) => (
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                timeout={1000}
                classNames="fade">
                <Switch location={location}>
                  <Route
                    exact
                    path={"/"}
                    render={() => reRouteIfAuthenticated(<Lander />)}
                  />
                  <Route
                    path={"/signin"}
                    render={() => reRouteIfAuthenticated(<SignIn />)}
                  />
                  <Route
                    path={"/dashboard"}
                    render={() => routeWithAuth(<Dashboard />)}
                  />
                  <Route
                    path={"/profile"}
                    render={() => routeWithAuth(<Profile />)}
                  />
                  <Route path="*" render={noMatch} />
                </Switch>
              </CSSTransition>
            </TransitionGroup>
          )}
        />
      </AppWrapper>
    );
  };

  const router = () => {
    return (
      <Router>
        <Switch>
          <Route path={"/confirmed"} render={() => <Confirmed />} />
          <Route path="*" render={nestedSwitch} />
        </Switch>
      </Router>
    );
  };

  const renderApp = () => {
    const app = !initializationComplete ? (
      <CenteredDiv vertical horizontal>
        <Spinner large />
      </CenteredDiv>
    ) : (
      router()
    );
    return app;
  };

  return renderApp();
};

export default MainRouter;
